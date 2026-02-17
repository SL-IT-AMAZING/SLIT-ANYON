/**
 * proxy.js – zero-dependency worker-based HTTP/WS forwarder
 */

const { parentPort, workerData } = require("node:worker_threads");

const http = require("node:http");
const https = require("node:https");

const { URL } = require("node:url");
const fs = require("node:fs");
const path = require("node:path");

/* ──────────────────────────── worker code ─────────────────────────────── */
const LISTEN_HOST = "localhost";
const LISTEN_PORT = workerData.port;
let rememberedOrigin = null; // e.g. "http://localhost:5173"

/* ---------- pre-configure rememberedOrigin from workerData ------- */
{
  const fixed = workerData?.targetOrigin;
  if (fixed) {
    try {
      rememberedOrigin = new URL(fixed).origin;
      parentPort?.postMessage(
        `[proxy-worker] fixed upstream: ${rememberedOrigin}`,
      );
    } catch {
      throw new Error(
        `Invalid target origin "${fixed}". Must be absolute http/https URL.`,
      );
    }
  }
}

/* ---------- optional resources for HTML injection ---------------------- */

let stacktraceJsContent = null;
let anyonShimContent = null;
let anyonComponentSelectorClientContent = null;
let anyonScreenshotClientContent = null;
let htmlToImageContent = null;
let anyonVisualEditorClientContent = null;
let anyonLogsContent = null;

const ANYON_ASSET_PREFIX = "/__anyon/";

try {
  const htmlToImagePath = path.join(
    __dirname,
    "..",
    "node_modules",
    "html-to-image",
    "dist",
    "html-to-image.js",
  );
  htmlToImageContent = fs.readFileSync(htmlToImagePath, "utf-8");
  parentPort?.postMessage(
    `[proxy-worker] html-to-image.js loaded from: ${htmlToImagePath}`,
  );
} catch (error) {
  parentPort?.postMessage(
    `[proxy-worker] Failed to read html-to-image.js: ${error.message}`,
  );
}

try {
  const stackTraceLibPath = path.join(
    __dirname,
    "..",
    "node_modules",
    "stacktrace-js",
    "dist",
    "stacktrace.min.js",
  );
  stacktraceJsContent = fs.readFileSync(stackTraceLibPath, "utf-8");
  parentPort?.postMessage("[proxy-worker] stacktrace.js loaded.");
} catch (error) {
  parentPort?.postMessage(
    `[proxy-worker] Failed to read stacktrace.js: ${error.message}`,
  );
}

try {
  const anyonShimPath = path.join(__dirname, "anyon-shim.js");
  anyonShimContent = fs.readFileSync(anyonShimPath, "utf-8");
  parentPort?.postMessage("[proxy-worker] anyon-shim.js loaded.");
} catch (error) {
  parentPort?.postMessage(
    `[proxy-worker] Failed to read anyon-shim.js: ${error.message}`,
  );
}

try {
  const anyonComponentSelectorClientPath = path.join(
    __dirname,
    "anyon-component-selector-client.js",
  );
  anyonComponentSelectorClientContent = fs.readFileSync(
    anyonComponentSelectorClientPath,
    "utf-8",
  );
  parentPort?.postMessage(
    "[proxy-worker] anyon-component-selector-client.js loaded.",
  );
} catch (error) {
  parentPort?.postMessage(
    `[proxy-worker] Failed to read anyon-component-selector-client.js: ${error.message}`,
  );
}

try {
  const anyonScreenshotClientPath = path.join(
    __dirname,
    "anyon-screenshot-client.js",
  );
  anyonScreenshotClientContent = fs.readFileSync(
    anyonScreenshotClientPath,
    "utf-8",
  );
  parentPort?.postMessage("[proxy-worker] anyon-screenshot-client.js loaded.");
} catch (error) {
  parentPort?.postMessage(
    `[proxy-worker] Failed to read anyon-screenshot-client.js: ${error.message}`,
  );
}

try {
  const anyonVisualEditorClientPath = path.join(
    __dirname,
    "anyon-visual-editor-client.js",
  );
  anyonVisualEditorClientContent = fs.readFileSync(
    anyonVisualEditorClientPath,
    "utf-8",
  );
  parentPort?.postMessage(
    "[proxy-worker] anyon-visual-editor-client.js loaded.",
  );
} catch (error) {
  parentPort?.postMessage(
    `[proxy-worker] Failed to read anyon-visual-editor-client.js: ${error.message}`,
  );
}

try {
  const anyonLogsPath = path.join(__dirname, "anyon_logs.js");
  anyonLogsContent = fs.readFileSync(anyonLogsPath, "utf-8");
  parentPort?.postMessage("[proxy-worker] anyon_logs.js loaded.");
} catch (error) {
  parentPort?.postMessage(
    `[proxy-worker] Failed to read anyon_logs.js: ${error.message}`,
  );
}

// Load Service Worker files
let anyonSwContent = null;
let anyonSwRegisterContent = null;

try {
  const anyonSwPath = path.join(__dirname, "anyon-sw.js");
  anyonSwContent = fs.readFileSync(anyonSwPath, "utf-8");
  parentPort?.postMessage("[proxy-worker] anyon-sw.js loaded.");
} catch (error) {
  parentPort?.postMessage(
    `[proxy-worker] Failed to read anyon-sw.js: ${error.message}`,
  );
}

try {
  const anyonSwRegisterPath = path.join(__dirname, "anyon-sw-register.js");
  anyonSwRegisterContent = fs.readFileSync(anyonSwRegisterPath, "utf-8");
  parentPort?.postMessage("[proxy-worker] anyon-sw-register.js loaded.");
} catch (error) {
  parentPort?.postMessage(
    `[proxy-worker] Failed to read anyon-sw-register.js: ${error.message}`,
  );
}

/* ---------------------- helper: need to inject? ------------------------ */
function needsInjection(pathname) {
  // Inject for routes without a file extension (e.g., "/foo", "/foo/bar", "/")
  const ext = path.extname(pathname).toLowerCase();
  return ext === "" || ext === ".html";
}

function parseMaybeCspHeader(value) {
  if (!value) return null;
  if (Array.isArray(value)) return value[0] || null;
  if (typeof value === "string") return value;
  return null;
}

function extractMetaCsp(html) {
  if (typeof html !== "string" || !html) return null;
  const metaRegex =
    /<meta[^>]+http-equiv\s*=\s*(?:"|')Content-Security-Policy(?:"|')[^>]*>/gi;
  const metas = html.match(metaRegex);
  if (!metas || metas.length === 0) return null;

  for (const meta of metas) {
    const contentMatch = meta.match(/content\s*=\s*(?:"([^"]*)"|'([^']*)')/i);
    const content =
      (contentMatch && (contentMatch[1] || contentMatch[2])) || null;
    if (content) return content;
  }
  return null;
}

function extractNonceFromScriptTags(html) {
  if (typeof html !== "string" || !html) return null;
  const nonceMatch = html.match(
    /<script[^>]+nonce\s*=\s*(?:"([^"]+)"|'([^']+)')[^>]*>/i,
  );
  return (nonceMatch && (nonceMatch[1] || nonceMatch[2])) || null;
}

function cspAllowsInlineScripts(csp) {
  if (!csp || typeof csp !== "string") return true;
  return /'unsafe-inline'/.test(csp);
}

function shouldUseExternalScripts({ cspHeader, htmlText }) {
  const header = parseMaybeCspHeader(cspHeader);
  if (header) {
    return !cspAllowsInlineScripts(header);
  }
  const meta = extractMetaCsp(htmlText);
  if (meta) {
    return !cspAllowsInlineScripts(meta);
  }
  return false;
}

function injectHTML(buf, { cspHeader } = {}) {
  let txt = buf.toString("utf8");
  // These are strings that were used since the first version of the anyon shim.
  // If the anyon shim is used from legacy apps which came pre-baked with the shim
  // as a vite plugin, then do not inject the shim twice to avoid weird behaviors.
  const legacyAppWithShim =
    txt.includes("window-error") && txt.includes("unhandled-rejection");

  const useExternalScripts = shouldUseExternalScripts({
    cspHeader,
    htmlText: txt,
  });

  const scriptNonce = useExternalScripts
    ? extractNonceFromScriptTags(txt)
    : null;
  const nonceAttr = scriptNonce ? ` nonce="${scriptNonce}"` : "";

  const scripts = [];

  if (useExternalScripts) {
    if (!legacyAppWithShim) {
      if (stacktraceJsContent) {
        scripts.push(
          `<script${nonceAttr} src="${ANYON_ASSET_PREFIX}stacktrace.min.js"></script>`,
        );
      }
      if (anyonShimContent) {
        scripts.push(
          `<script${nonceAttr} src="${ANYON_ASSET_PREFIX}anyon-shim.js"></script>`,
        );
      }
    }

    if (anyonComponentSelectorClientContent) {
      scripts.push(
        `<script${nonceAttr} src="${ANYON_ASSET_PREFIX}anyon-component-selector-client.js"></script>`,
      );
    }
    if (htmlToImageContent) {
      scripts.push(
        `<script${nonceAttr} src="${ANYON_ASSET_PREFIX}html-to-image.js"></script>`,
      );
    }
    if (anyonScreenshotClientContent) {
      scripts.push(
        `<script${nonceAttr} src="${ANYON_ASSET_PREFIX}anyon-screenshot-client.js"></script>`,
      );
    }
    if (anyonVisualEditorClientContent) {
      scripts.push(
        `<script${nonceAttr} src="${ANYON_ASSET_PREFIX}anyon-visual-editor-client.js"></script>`,
      );
    }
    if (anyonLogsContent) {
      scripts.push(
        `<script${nonceAttr} src="${ANYON_ASSET_PREFIX}anyon_logs.js"></script>`,
      );
    }
    if (anyonSwRegisterContent) {
      scripts.push(
        `<script${nonceAttr} src="${ANYON_ASSET_PREFIX}anyon-sw-register.js"></script>`,
      );
    }
  } else {
    if (!legacyAppWithShim) {
      if (stacktraceJsContent) {
        scripts.push(`<script>${stacktraceJsContent}</script>`);
      } else {
        scripts.push(
          '<script>console.warn("[proxy-worker] stacktrace.js was not injected.");</script>',
        );
      }

      if (anyonShimContent) {
        scripts.push(`<script>${anyonShimContent}</script>`);
      } else {
        scripts.push(
          '<script>console.warn("[proxy-worker] anyon shim was not injected.");</script>',
        );
      }
    }
    if (anyonComponentSelectorClientContent) {
      scripts.push(`<script>${anyonComponentSelectorClientContent}</script>`);
    } else {
      scripts.push(
        '<script>console.warn("[proxy-worker] anyon component selector client was not injected.");</script>',
      );
    }
    if (htmlToImageContent) {
      scripts.push(`<script>${htmlToImageContent}</script>`);
      parentPort?.postMessage(
        "[proxy-worker] html-to-image script injected into HTML.",
      );
    } else {
      scripts.push(
        '<script>console.error("[proxy-worker] html-to-image was not injected - library not loaded.");</script>',
      );
      parentPort?.postMessage(
        "[proxy-worker] WARNING: html-to-image not injected!",
      );
    }
    if (anyonScreenshotClientContent) {
      scripts.push(`<script>${anyonScreenshotClientContent}</script>`);
    } else {
      scripts.push(
        '<script>console.warn("[proxy-worker] anyon screenshot client was not injected.");</script>',
      );
    }
    if (anyonVisualEditorClientContent) {
      scripts.push(`<script>${anyonVisualEditorClientContent}</script>`);
    } else {
      scripts.push(
        '<script>console.warn("[proxy-worker] anyon visual editor client was not injected.");</script>',
      );
    }
    if (anyonLogsContent) {
      scripts.push(`<script>${anyonLogsContent}</script>`);
    } else {
      scripts.push(
        '<script>console.warn("[proxy-worker] anyon_logs.js was not injected.");</script>',
      );
    }
    if (anyonSwRegisterContent) {
      scripts.push(`<script>${anyonSwRegisterContent}</script>`);
    } else {
      scripts.push(
        '<script>console.warn("[proxy-worker] anyon-sw-register.js was not injected.");</script>',
      );
    }
  }
  const allScripts = scripts.join("\n");

  const headRegex = /<head[^>]*>/i;
  if (headRegex.test(txt)) {
    txt = txt.replace(headRegex, `$&\n${allScripts}`);
  } else {
    txt = `${allScripts}\n${txt}`;
    parentPort?.postMessage(
      "[proxy-worker] Warning: <head> tag not found – scripts prepended.",
    );
  }
  return Buffer.from(txt, "utf8");
}

function withoutHeader(headers, headerName) {
  const target = headerName.toLowerCase();
  return Object.fromEntries(
    Object.entries(headers).filter(([key]) => key.toLowerCase() !== target),
  );
}

function withoutHeaders(headers, headerNames) {
  return headerNames.reduce((acc, name) => withoutHeader(acc, name), headers);
}

function withoutResponseHeaders(headers, headerNames) {
  const targets = new Set(headerNames.map((name) => name.toLowerCase()));
  return Object.fromEntries(
    Object.entries(headers).filter(([key]) => !targets.has(key.toLowerCase())),
  );
}

/* ---------------- helper: build upstream URL from request -------------- */
function buildTargetURL(clientReq) {
  if (!rememberedOrigin) throw new Error("No upstream configured.");

  // Forward to the remembered origin keeping path & query
  return new URL(clientReq.url, rememberedOrigin);
}

/* ----------------------------------------------------------------------- */
/* 1. Plain HTTP request / response                                        */
/* ----------------------------------------------------------------------- */

const server = http.createServer((clientReq, clientRes) => {
  if (
    typeof clientReq.url === "string" &&
    clientReq.url.startsWith(ANYON_ASSET_PREFIX)
  ) {
    const requestPath = clientReq.url.split("?")[0] || "";
    const assetName = requestPath.slice(ANYON_ASSET_PREFIX.length);

    if (!assetName || assetName.includes("/") || assetName.includes("..")) {
      clientRes.writeHead(400, { "content-type": "text/plain" });
      clientRes.end("Bad request");
      return;
    }

    const assets = {
      "stacktrace.min.js": stacktraceJsContent,
      "anyon-shim.js": anyonShimContent,
      "anyon-component-selector-client.js": anyonComponentSelectorClientContent,
      "html-to-image.js": htmlToImageContent,
      "anyon-screenshot-client.js": anyonScreenshotClientContent,
      "anyon-visual-editor-client.js": anyonVisualEditorClientContent,
      "anyon_logs.js": anyonLogsContent,
      "anyon-sw-register.js": anyonSwRegisterContent,
    };

    const body = assets[assetName];
    if (!body) {
      clientRes.writeHead(404, { "content-type": "text/plain" });
      clientRes.end("Not found");
      return;
    }

    clientRes.writeHead(200, {
      "content-type": "application/javascript; charset=utf-8",
      "cache-control": "no-cache",
    });
    clientRes.end(body);
    return;
  }

  // Special handling for Service Worker file
  if (clientReq.url === "/anyon-sw.js") {
    if (anyonSwContent) {
      clientRes.writeHead(200, {
        "content-type": "application/javascript",
        "service-worker-allowed": "/",
        "cache-control": "no-cache",
      });
      clientRes.end(anyonSwContent);
      return;
    }

    clientRes.writeHead(404, { "content-type": "text/plain" });
    clientRes.end("Service Worker file not found");
    return;
  }

  let target;
  try {
    target = buildTargetURL(clientReq);
  } catch (err) {
    clientRes.writeHead(400, { "content-type": "text/plain" });
    return void clientRes.end(`Bad request: ${err.message}`);
  }

  const isTLS = target.protocol === "https:";
  const lib = isTLS ? https : http;

  let headers = { ...clientReq.headers, host: target.host };
  if (headers.origin) headers.origin = target.origin;
  if (headers.referer) {
    try {
      const ref = new URL(headers.referer);
      headers.referer = `${target.origin}${ref.pathname}${ref.search}`;
    } catch {
      headers = withoutHeader(headers, "referer");
    }
  }
  if (needsInjection(target.pathname)) {
    headers = withoutHeaders(headers, ["accept-encoding", "if-none-match"]);
  }

  const upOpts = {
    protocol: target.protocol,
    hostname: target.hostname,
    port: target.port || (isTLS ? 443 : 80),
    path: target.pathname + target.search,
    method: clientReq.method,
    headers,
  };

  const upReq = lib.request(upOpts, (upRes) => {
    const wantsInjection = needsInjection(target.pathname);
    // Only inject when upstream indicates HTML content
    const contentTypeHeader = upRes.headers["content-type"];
    const contentType = Array.isArray(contentTypeHeader)
      ? contentTypeHeader[0]
      : contentTypeHeader || "";
    const isHtml =
      typeof contentType === "string" &&
      contentType.toLowerCase().includes("text/html");
    const inject = wantsInjection && isHtml;

    if (!inject) {
      clientRes.writeHead(upRes.statusCode, upRes.headers);
      return void upRes.pipe(clientRes);
    }

    const chunks = [];
    upRes.on("data", (c) => chunks.push(c));
    upRes.on("end", () => {
      try {
        const merged = Buffer.concat(chunks);
        const patched = injectHTML(merged, {
          cspHeader: upRes.headers["content-security-policy"],
        });

        const hdrs = {
          ...withoutResponseHeaders(upRes.headers, [
            "content-encoding",
            "etag",
            "transfer-encoding",
          ]),
          "content-length": Buffer.byteLength(patched),
        };

        clientRes.writeHead(upRes.statusCode, hdrs);
        clientRes.end(patched);
      } catch (e) {
        clientRes.writeHead(500, { "content-type": "text/plain" });
        clientRes.end(`Injection failed: ${e.message}`);
      }
    });
  });

  clientReq.pipe(upReq);
  upReq.on("error", (e) => {
    clientRes.writeHead(502, { "content-type": "text/plain" });
    clientRes.end(`Upstream error: ${e.message}`);
  });
});

/* ----------------------------------------------------------------------- */
/* 2. WebSocket / generic Upgrade tunnelling                               */
/* ----------------------------------------------------------------------- */

server.on("upgrade", (req, socket, _head) => {
  let target;
  try {
    target = buildTargetURL(req);
  } catch (err) {
    socket.write(`HTTP/1.1 400 Bad Request\r\n\r\n${err.message}`);
    return socket.destroy();
  }

  const isTLS = target.protocol === "https:";
  const headers = { ...req.headers, host: target.host };
  if (headers.origin) headers.origin = target.origin;

  const upReq = (isTLS ? https : http).request({
    protocol: target.protocol,
    hostname: target.hostname,
    port: target.port || (isTLS ? 443 : 80),
    path: target.pathname + target.search,
    method: "GET",
    headers,
  });

  upReq.on("upgrade", (upRes, upSocket, upHead) => {
    socket.write(
      `HTTP/1.1 101 Switching Protocols\r\n${Object.entries(upRes.headers)
        .map(([k, v]) => `${k}: ${v}`)
        .join("\r\n")}\r\n\r\n`,
    );
    if (upHead?.length) socket.write(upHead);

    upSocket.pipe(socket).pipe(upSocket);
  });

  upReq.on("error", () => socket.destroy());
  upReq.end();
});

/* ----------------------------------------------------------------------- */

server.listen(LISTEN_PORT, LISTEN_HOST, () => {
  parentPort?.postMessage(
    `proxy-server-start url=http://${LISTEN_HOST}:${LISTEN_PORT}`,
  );
});
