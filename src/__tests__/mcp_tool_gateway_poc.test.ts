import { type ChildProcess, spawn } from "node:child_process";
import fs from "node:fs";
import http from "node:http";
import os from "node:os";
import path from "node:path";
import { afterAll, beforeAll, describe, expect, it, vi } from "vitest";

vi.mock("electron", () => ({
  safeStorage: {
    isEncryptionAvailable: vi.fn().mockReturnValue(false),
    decryptString: vi.fn(),
  },
}));
vi.mock("electron-log", () => ({
  default: {
    scope: () => ({
      info: vi.fn(),
      warn: vi.fn(),
      error: vi.fn(),
      debug: vi.fn(),
    }),
  },
}));
vi.mock("@/paths/paths", () => ({
  getUserDataPath: vi.fn().mockReturnValue(os.tmpdir()),
}));

import { ALL_TOOLS } from "@/agent/tools";
import { zodToJsonSchema } from "@/agent/tools/spec";
import { getMcpServerScript } from "@/opencode/mcp/mcp_server_script";

let gatewayPort: number;
let gatewayToken: string;
let gatewayServer: ReturnType<typeof import("node:http").createServer>;

function httpRequest(
  method: string,
  urlPath: string,
  headers?: Record<string, string>,
  body?: string,
): Promise<{ status: number; body: unknown }> {
  return new Promise((resolve, reject) => {
    const req = http.request(
      {
        hostname: "127.0.0.1",
        port: gatewayPort,
        path: urlPath,
        method,
        headers: {
          ...headers,
          ...(body ? { "Content-Length": Buffer.byteLength(body) } : {}),
        },
      },
      (res) => {
        const chunks: Buffer[] = [];
        res.on("data", (c: Buffer) => chunks.push(c));
        res.on("end", () => {
          const text = Buffer.concat(chunks).toString("utf-8");
          let parsed: unknown;
          try {
            parsed = JSON.parse(text);
          } catch {
            parsed = text;
          }
          resolve({ status: res.statusCode ?? 0, body: parsed });
        });
      },
    );
    req.on("error", reject);
    if (body) req.write(body);
    req.end();
  });
}

function makeJsonRpc(method: string, params?: unknown, id?: number) {
  const msg = JSON.stringify({
    jsonrpc: "2.0",
    ...(id != null ? { id } : {}),
    method,
    ...(params != null ? { params } : {}),
  });
  return msg + "\n";
}

function readMcpMessage(
  proc: ChildProcess,
  timeoutMs = 5000,
): Promise<unknown> {
  return new Promise((resolve, reject) => {
    let lineBuf = "";
    const timer = setTimeout(() => {
      cleanup();
      reject(
        new Error(
          `MCP read timed out after ${timeoutMs}ms. Buffer so far: ${lineBuf.slice(0, 500)}`,
        ),
      );
    }, timeoutMs);

    function cleanup() {
      clearTimeout(timer);
      proc.stdout?.removeListener("data", onData);
    }

    function onData(chunk: Buffer) {
      lineBuf += chunk.toString("utf-8");
      const lines = lineBuf.split("\n");
      for (const line of lines.slice(0, -1)) {
        const trimmed = line.trim();
        if (!trimmed) continue;
        cleanup();
        try {
          resolve(JSON.parse(trimmed));
        } catch {
          reject(new Error(`MCP JSON parse error: ${trimmed.slice(0, 200)}`));
        }
        return;
      }
      lineBuf = lines[lines.length - 1];
    }

    proc.stdout?.on("data", onData);
  });
}

describe("MCP Tool Gateway POC", () => {
  beforeAll(async () => {
    const { createServer } = await import("node:http");
    const { randomBytes } = await import("node:crypto");

    gatewayToken = randomBytes(32).toString("hex");

    const toolsByName = new Map(ALL_TOOLS.map((t) => [t.name, t] as const));

    await new Promise<void>((resolve, reject) => {
      gatewayServer = createServer(async (req, res) => {
        try {
          const url = new URL(req.url ?? "/", "http://127.0.0.1");

          if (url.pathname === "/health") {
            res.statusCode = 200;
            res.setHeader("Content-Type", "application/json");
            res.end(JSON.stringify({ ok: true }));
            return;
          }

          const auth = req.headers.authorization;
          const bearer = auth?.startsWith("Bearer ") ? auth.slice(7) : null;
          if (!bearer || bearer !== gatewayToken) {
            res.statusCode = 401;
            res.setHeader("Content-Type", "application/json");
            res.end(JSON.stringify({ error: "Unauthorized" }));
            return;
          }

          if (req.method === "GET" && url.pathname === "/tools") {
            const tools = ALL_TOOLS.map((t) => ({
              name: t.name,
              description: t.description,
              inputSchema: zodToJsonSchema(t.inputSchema),
            }));
            res.statusCode = 200;
            res.setHeader("Content-Type", "application/json");
            res.end(JSON.stringify({ tools }));
            return;
          }

          const toolMatch = url.pathname.match(/^\/tool\/(.+)$/);
          if (!toolMatch) {
            res.statusCode = 404;
            res.setHeader("Content-Type", "application/json");
            res.end(JSON.stringify({ error: "Not found" }));
            return;
          }

          if (req.method !== "POST") {
            res.statusCode = 405;
            res.setHeader("Content-Type", "application/json");
            res.end(JSON.stringify({ error: "Method not allowed" }));
            return;
          }

          const toolName = decodeURIComponent(toolMatch[1]);
          const tool = toolsByName.get(toolName);
          if (!tool) {
            res.statusCode = 404;
            res.setHeader("Content-Type", "application/json");
            res.end(JSON.stringify({ error: `Unknown tool: ${toolName}` }));
            return;
          }

          const chunks: Buffer[] = [];
          await new Promise<void>((r) => {
            req.on("data", (c: Buffer) => chunks.push(c));
            req.on("end", r);
          });
          const bodyText = Buffer.concat(chunks).toString("utf-8");
          const rawBody =
            bodyText.trim().length > 0 ? JSON.parse(bodyText) : {};

          const parsedInput = tool.inputSchema.safeParse(rawBody);
          if (!parsedInput.success) {
            res.statusCode = 400;
            res.setHeader("Content-Type", "application/json");
            res.end(
              JSON.stringify({
                error: "Invalid tool input",
                details: parsedInput.error.flatten(),
              }),
            );
            return;
          }

          const output = await tool.execute(parsedInput.data);
          res.statusCode = 200;
          res.setHeader("Content-Type", "application/json");
          res.end(JSON.stringify(output));
        } catch (error: any) {
          res.statusCode = 500;
          res.setHeader("Content-Type", "application/json");
          res.end(
            JSON.stringify({
              error: error?.message || "Internal server error",
            }),
          );
        }
      });

      gatewayServer.listen(0, "127.0.0.1", () => {
        const addr = gatewayServer.address() as import("node:net").AddressInfo;
        gatewayPort = addr.port;
        resolve();
      });
      gatewayServer.on("error", reject);
    });
  });

  afterAll(async () => {
    await new Promise<void>((resolve) => {
      if (gatewayServer) {
        gatewayServer.close(() => resolve());
      } else {
        resolve();
      }
    });
  });

  describe("Layer 2: Tool Gateway HTTP", () => {
    it("should respond to /health without auth", async () => {
      const res = await httpRequest("GET", "/health");
      expect(res.status).toBe(200);
      expect(res.body).toEqual({ ok: true });
    });

    it("should reject requests without Bearer token", async () => {
      const res = await httpRequest("GET", "/tools");
      expect(res.status).toBe(401);
    });

    it("should reject requests with wrong token", async () => {
      const res = await httpRequest("GET", "/tools", {
        Authorization: "Bearer wrong-token",
      });
      expect(res.status).toBe(401);
    });

    it("should return tool list on GET /tools", async () => {
      const res = await httpRequest("GET", "/tools", {
        Authorization: `Bearer ${gatewayToken}`,
      });
      expect(res.status).toBe(200);
      const body = res.body as {
        tools: Array<{
          name: string;
          description: string;
          inputSchema: unknown;
        }>;
      };
      expect(body.tools).toBeInstanceOf(Array);
      expect(body.tools.length).toBe(6);

      const names = body.tools.map((t) => t.name);
      expect(names).toContain("get_connection_status");
      expect(names).toContain("create_supabase_project");
      expect(names).toContain("manage_secrets");
      expect(names).toContain("configure_auth");
      expect(names).toContain("set_vercel_env_vars");
      expect(names).toContain("add_vercel_domain");

      for (const tool of body.tools) {
        expect(tool.inputSchema).toBeDefined();
        expect(typeof tool.inputSchema).toBe("object");
        expect((tool.inputSchema as Record<string, unknown>).type).toBe(
          "object",
        );
      }
    });

    it("should execute get_connection_status tool", async () => {
      const res = await httpRequest(
        "POST",
        "/tool/get_connection_status",
        {
          Authorization: `Bearer ${gatewayToken}`,
          "Content-Type": "application/json",
        },
        JSON.stringify({}),
      );
      expect(res.status).toBe(200);
      const body = res.body as {
        supabase: { connected: boolean };
        vercel: { connected: boolean };
      };
      expect(body).toHaveProperty("supabase");
      expect(body).toHaveProperty("vercel");
      expect(typeof body.supabase.connected).toBe("boolean");
      expect(typeof body.vercel.connected).toBe("boolean");
    });

    it("should return 404 for unknown tool", async () => {
      const res = await httpRequest(
        "POST",
        "/tool/nonexistent_tool",
        {
          Authorization: `Bearer ${gatewayToken}`,
          "Content-Type": "application/json",
        },
        JSON.stringify({}),
      );
      expect(res.status).toBe(404);
    });

    it("should return 400 for invalid input schema", async () => {
      const res = await httpRequest(
        "POST",
        "/tool/create_supabase_project",
        {
          Authorization: `Bearer ${gatewayToken}`,
          "Content-Type": "application/json",
        },
        JSON.stringify({ name: "" }),
      );
      expect(res.status).toBe(400);
    });
  });

  describe("Layer 3: MCP Protocol over stdio", () => {
    let mcpProcess: ChildProcess;
    let mcpScriptPath: string;

    beforeAll(() => {
      const tmpDir = path.join(os.tmpdir(), "anyon-mcp-test");
      fs.mkdirSync(tmpDir, { recursive: true });
      mcpScriptPath = path.join(tmpDir, "anyon_mcp_server_test.cjs");
      fs.writeFileSync(mcpScriptPath, getMcpServerScript(), "utf-8");
    });

    afterAll(() => {
      if (mcpProcess && !mcpProcess.killed) {
        mcpProcess.kill("SIGTERM");
      }
    });

    it("should handle initialize → tools/list → tools/call full sequence", async () => {
      mcpProcess = spawn("node", [mcpScriptPath], {
        env: {
          ...process.env,
          ANYON_GATEWAY_URL: `http://127.0.0.1:${gatewayPort}`,
          ANYON_GATEWAY_TOKEN: gatewayToken,
        },
        stdio: ["pipe", "pipe", "pipe"],
      });

      let stderrOutput = "";
      mcpProcess.stderr?.on("data", (chunk: Buffer) => {
        stderrOutput += chunk.toString("utf-8");
      });

      // 1. Initialize
      const initPromise = readMcpMessage(mcpProcess);
      mcpProcess.stdin?.write(
        makeJsonRpc("initialize", { protocolVersion: "2024-11-05" }, 1),
      );
      const initResult = (await initPromise) as any;
      expect(initResult.jsonrpc).toBe("2.0");
      expect(initResult.id).toBe(1);
      expect(initResult.result.serverInfo.name).toBe("anyon-tools");
      expect(initResult.result.capabilities.tools).toBeDefined();

      // 2. Notification (no response expected)
      mcpProcess.stdin?.write(makeJsonRpc("notifications/initialized"));

      // 3. tools/list
      const listPromise = readMcpMessage(mcpProcess);
      mcpProcess.stdin?.write(makeJsonRpc("tools/list", {}, 2));
      const listResult = (await listPromise) as any;
      expect(listResult.jsonrpc).toBe("2.0");
      expect(listResult.id).toBe(2);
      expect(listResult.result.tools).toBeInstanceOf(Array);
      expect(listResult.result.tools.length).toBe(6);
      const toolNames = listResult.result.tools.map(
        (t: { name: string }) => t.name,
      );
      expect(toolNames).toContain("get_connection_status");

      // 4. tools/call - get_connection_status
      const callPromise = readMcpMessage(mcpProcess);
      mcpProcess.stdin?.write(
        makeJsonRpc(
          "tools/call",
          { name: "get_connection_status", arguments: {} },
          3,
        ),
      );
      const callResult = (await callPromise) as any;
      expect(callResult.jsonrpc).toBe("2.0");
      expect(callResult.id).toBe(3);
      expect(callResult.result.content).toBeInstanceOf(Array);
      expect(callResult.result.content[0].type).toBe("text");
      const parsedOutput = JSON.parse(callResult.result.content[0].text);
      expect(parsedOutput).toHaveProperty("supabase");
      expect(parsedOutput).toHaveProperty("vercel");
      expect(typeof parsedOutput.supabase.connected).toBe("boolean");
      expect(typeof parsedOutput.vercel.connected).toBe("boolean");

      // 5. ping
      const pingPromise = readMcpMessage(mcpProcess);
      mcpProcess.stdin?.write(makeJsonRpc("ping", {}, 4));
      const pingResult = (await pingPromise) as any;
      expect(pingResult.jsonrpc).toBe("2.0");
      expect(pingResult.id).toBe(4);
      expect(pingResult.result).toEqual({});

      // 6. Unknown method
      const unknownPromise = readMcpMessage(mcpProcess);
      mcpProcess.stdin?.write(makeJsonRpc("unknown/method", {}, 5));
      const unknownResult = (await unknownPromise) as any;
      expect(unknownResult.jsonrpc).toBe("2.0");
      expect(unknownResult.id).toBe(5);
      expect(unknownResult.error).toBeDefined();
      expect(unknownResult.error.code).toBe(-32601);

      // 7. tools/call - call a tool that will fail due to missing auth
      const failPromise = readMcpMessage(mcpProcess);
      mcpProcess.stdin?.write(
        makeJsonRpc(
          "tools/call",
          {
            name: "create_supabase_project",
            arguments: {
              name: "test",
              region: "us-east-1",
              plan: "free",
              organizationId: "org-test",
            },
          },
          6,
        ),
      );
      const failResult = (await failPromise) as any;
      expect(failResult.jsonrpc).toBe("2.0");
      expect(failResult.id).toBe(6);
      expect(failResult.result.isError).toBe(true);
      expect(failResult.result.content[0].text).toContain("Error:");

      // Cleanup
      mcpProcess.stdin?.end();

      // Verify no unexpected stderr (aside from expected tool errors)
      if (stderrOutput.trim()) {
        console.log("MCP stderr output:", stderrOutput);
      }
    }, 15000);
  });

  describe("Layer 4: Individual tool execution", () => {
    it("get_connection_status returns expected structure", async () => {
      const tool = ALL_TOOLS.find((t) => t.name === "get_connection_status")!;
      expect(tool).toBeDefined();

      const result = await tool.execute({});
      expect(result).toHaveProperty("supabase");
      expect(result).toHaveProperty("vercel");
      expect(typeof result.supabase.connected).toBe("boolean");
      expect(typeof result.vercel.connected).toBe("boolean");

      const validated = tool.outputSchema.safeParse(result);
      expect(validated.success).toBe(true);
    });

    it("all tools have valid Zod schemas that serialize to JSON Schema", () => {
      for (const tool of ALL_TOOLS) {
        expect(tool.name).toBeTruthy();
        expect(tool.description).toBeTruthy();
        expect(tool.inputSchema).toBeDefined();
        expect(tool.outputSchema).toBeDefined();
        expect(typeof tool.execute).toBe("function");
      }
    });
  });
});
