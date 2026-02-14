import { randomBytes } from "node:crypto";
import {
  createServer,
  type IncomingMessage,
  type Server,
  type ServerResponse,
} from "node:http";
import type { AddressInfo } from "node:net";
import log from "electron-log";
import { ALL_TOOLS } from "../agent/tools";

const logger = log.scope("tool-gateway");

type ToolSummary = {
  name: string;
  description: string;
};

function jsonResponse(
  res: ServerResponse<IncomingMessage>,
  statusCode: number,
  body: unknown,
) {
  res.statusCode = statusCode;
  res.setHeader("Content-Type", "application/json");
  res.end(JSON.stringify(body));
}

async function readJsonBody(req: IncomingMessage): Promise<unknown> {
  const chunks: Buffer[] = [];

  await new Promise<void>((resolve, reject) => {
    req.on("data", (chunk: Buffer) => chunks.push(chunk));
    req.on("end", resolve);
    req.on("error", reject);
  });

  if (chunks.length === 0) {
    return {};
  }

  const text = Buffer.concat(chunks).toString("utf-8");
  if (text.trim().length === 0) {
    return {};
  }

  return JSON.parse(text);
}

function getBearerToken(authHeader: string | undefined): string | null {
  if (!authHeader) return null;
  const [scheme, token] = authHeader.split(" ");
  if (scheme !== "Bearer" || !token) return null;
  return token;
}

class ToolGateway {
  private server: Server | null = null;
  private port: number | null = null;
  private token: string = "";

  async start(): Promise<{ port: number; token: string }> {
    if (this.server) {
      return { port: this.port!, token: this.token };
    }

    const toolsByName = new Map(ALL_TOOLS.map((t) => [t.name, t] as const));
    this.token = randomBytes(32).toString("hex");

    return new Promise((resolve, reject) => {
      this.server = createServer(async (req, res) => {
        try {
          const url = new URL(req.url ?? "/", "http://127.0.0.1");

          if (url.pathname === "/health") {
            return jsonResponse(res, 200, { ok: true });
          }

          const bearer = getBearerToken(req.headers.authorization);
          if (!bearer || bearer !== this.token) {
            return jsonResponse(res, 401, { error: "Unauthorized" });
          }

          if (req.method === "GET" && url.pathname === "/tools") {
            const tools: ToolSummary[] = ALL_TOOLS.map((t) => ({
              name: t.name,
              description: t.description,
            }));
            return jsonResponse(res, 200, { tools });
          }

          const toolMatch = url.pathname.match(/^\/tool\/(.+)$/);
          if (!toolMatch) {
            return jsonResponse(res, 404, { error: "Not found" });
          }

          if (req.method !== "POST") {
            return jsonResponse(res, 405, { error: "Method not allowed" });
          }

          const toolName = decodeURIComponent(toolMatch[1]);
          const tool = toolsByName.get(toolName);
          if (!tool) {
            return jsonResponse(res, 404, {
              error: `Unknown tool: ${toolName}`,
            });
          }

          let rawBody: unknown;
          try {
            rawBody = await readJsonBody(req);
          } catch (error) {
            logger.warn(
              `Failed to parse tool request JSON for ${toolName}:`,
              error,
            );
            return jsonResponse(res, 400, { error: "Invalid JSON body" });
          }

          const parsedInput = tool.inputSchema.safeParse(rawBody);
          if (!parsedInput.success) {
            return jsonResponse(res, 400, {
              error: "Invalid tool input",
              details: parsedInput.error.flatten(),
            });
          }

          const output = await tool.execute(parsedInput.data);
          const validatedOutput = tool.outputSchema.safeParse(output);
          if (!validatedOutput.success) {
            logger.error(
              `Tool output schema mismatch for ${toolName}:`,
              validatedOutput.error,
            );
            return jsonResponse(res, 500, {
              error: "Tool returned invalid output",
            });
          }

          return jsonResponse(res, 200, validatedOutput.data);
        } catch (error: any) {
          logger.error("Tool gateway error:", error);
          return jsonResponse(res, 500, {
            error: error?.message || "Internal server error",
          });
        }
      });

      this.server.listen(0, "127.0.0.1", () => {
        const addr = this.server!.address() as AddressInfo;
        this.port = addr.port;
        logger.info(`Tool Gateway listening on 127.0.0.1:${this.port}`);
        resolve({ port: this.port, token: this.token });
      });

      this.server.on("error", (err) => {
        logger.error("Tool Gateway server error:", err);
        reject(err);
      });
    });
  }

  async stop(): Promise<void> {
    if (!this.server) return;

    await new Promise<void>((resolve, reject) => {
      this.server!.close((err) => {
        if (err) return reject(err);
        resolve();
      });
    });

    this.server = null;
    this.port = null;
    this.token = "";
  }
}

export const toolGateway = new ToolGateway();
