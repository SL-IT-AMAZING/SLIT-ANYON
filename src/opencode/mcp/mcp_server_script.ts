/**
 * Returns the MCP server source as a JavaScript string.
 * Written to a temp file at runtime so OpenCode can spawn it
 * as a subprocess without any bundling/path-resolution issues.
 */
export function getMcpServerScript(): string {
  return `
"use strict";

const GATEWAY_URL = process.env.ANYON_GATEWAY_URL || "";
const GATEWAY_TOKEN = process.env.ANYON_GATEWAY_TOKEN || "";

if (!GATEWAY_URL || !GATEWAY_TOKEN) {
  process.stderr.write("ANYON_GATEWAY_URL and ANYON_GATEWAY_TOKEN must be set.\\n");
  process.exit(1);
}

async function gatewayFetch(urlPath, init) {
  const url = new URL(urlPath, GATEWAY_URL);
  const headers = { Authorization: "Bearer " + GATEWAY_TOKEN, ...(init && init.headers || {}) };
  return fetch(url.toString(), Object.assign({}, init, { headers }));
}

let cachedTools = null;

async function listTools() {
  if (cachedTools) return cachedTools;
  const res = await gatewayFetch("/tools");
  if (!res.ok) throw new Error("Gateway /tools: " + res.status);
  const json = await res.json();
  cachedTools = json.tools;
  return cachedTools;
}

async function callTool(name, args) {
  const res = await gatewayFetch("/tool/" + encodeURIComponent(name), {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(args),
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error("Gateway tool " + name + ": " + res.status + " — " + text);
  }
  return res.json();
}

function sendMsg(msg) {
  const buf = Buffer.from(msg, "utf-8");
  process.stdout.write("Content-Length: " + buf.byteLength + "\\r\\n\\r\\n");
  process.stdout.write(buf);
}

function makeResult(id, result) {
  return JSON.stringify({ jsonrpc: "2.0", id: id, result: result });
}

function makeError(id, code, message) {
  return JSON.stringify({ jsonrpc: "2.0", id: id, error: { code: code, message: message } });
}

async function handleRequest(req) {
  var id = req.id != null ? req.id : null;
  switch (req.method) {
    case "initialize":
      sendMsg(makeResult(id, {
        protocolVersion: "2024-11-05",
        serverInfo: { name: "anyon-tools", version: "0.1.0" },
        capabilities: { tools: {} },
      }));
      break;
    case "notifications/initialized":
      break;
    case "tools/list": {
      var tools = await listTools();
      sendMsg(makeResult(id, {
        tools: tools.map(function(t) {
          return { name: t.name, description: t.description, inputSchema: t.inputSchema };
        }),
      }));
      break;
    }
    case "tools/call": {
      var params = req.params || {};
      var toolName = params.name;
      var toolArgs = params.arguments || {};
      try {
        var result = await callTool(toolName, toolArgs);
        sendMsg(makeResult(id, {
          content: [{ type: "text", text: JSON.stringify(result, null, 2) }],
        }));
      } catch (err) {
        var msg = err instanceof Error ? err.message : String(err);
        sendMsg(makeResult(id, {
          content: [{ type: "text", text: "Error: " + msg }],
          isError: true,
        }));
      }
      break;
    }
    case "ping":
      sendMsg(makeResult(id, {}));
      break;
    default:
      if (id !== null) sendMsg(makeError(id, -32601, "Method not found: " + req.method));
  }
}

var buffer = Buffer.alloc(0);
var contentLength = -1;

process.stdin.on("data", function(chunk) {
  buffer = Buffer.concat([buffer, chunk]);
  processBuffer();
});

process.stdin.on("end", function() { process.exit(0); });

function processBuffer() {
  for (;;) {
    if (contentLength === -1) {
      var headerEnd = buffer.indexOf("\\r\\n\\r\\n");
      if (headerEnd === -1) return;
      var headerSection = buffer.subarray(0, headerEnd).toString("utf-8");
      var match = headerSection.match(/Content-Length:\\s*(\\d+)/i);
      if (!match) {
        process.stderr.write("Invalid MCP header: " + headerSection + "\\n");
        buffer = buffer.subarray(headerEnd + 4);
        continue;
      }
      contentLength = parseInt(match[1], 10);
      buffer = buffer.subarray(headerEnd + 4);
    }
    if (buffer.byteLength < contentLength) return;
    var body = buffer.subarray(0, contentLength).toString("utf-8");
    buffer = buffer.subarray(contentLength);
    contentLength = -1;
    try {
      var msg = JSON.parse(body);
      handleRequest(msg).catch(function(err) {
        process.stderr.write("MCP handler error: " + (err instanceof Error ? err.message : String(err)) + "\\n");
        if (msg.id != null) sendMsg(makeError(msg.id, -32603, "Internal error"));
      });
    } catch(e) {
      process.stderr.write("MCP parse error: " + body.slice(0, 200) + "\\n");
    }
  }
}
`.trim();
}
