import type { ChildProcess } from "node:child_process";
import log from "electron-log";

const logger = log.scope("mcp-jsonrpc");

interface JsonRpcRequest {
  jsonrpc: "2.0";
  id: number;
  method: string;
  params?: unknown;
}

interface JsonRpcResponse {
  jsonrpc: "2.0";
  id: number;
  result?: unknown;
  error?: {
    code: number;
    message: string;
    data?: unknown;
  };
}

interface JsonRpcNotification {
  jsonrpc: "2.0";
  method: string;
  params?: unknown;
}

type PendingRequest = {
  resolve: (value: unknown) => void;
  reject: (reason: Error) => void;
  timer: ReturnType<typeof setTimeout>;
};

export class McpJsonRpcClient {
  private nextId = 1;

  private pending = new Map<number, PendingRequest>();

  private buffer = "";

  private destroyed = false;

  constructor(private readonly process: ChildProcess) {
    if (process.stdout) {
      process.stdout.on("data", (data: Buffer) => this.handleData(data));
    }

    if (process.stderr) {
      process.stderr.on("data", (data: Buffer) => {
        logger.debug("MCP stderr:", data.toString());
      });
    }

    process.on("exit", () => {
      this.destroyed = true;
      for (const [id, req] of this.pending) {
        req.reject(new Error("MCP process exited"));
        clearTimeout(req.timer);
        this.pending.delete(id);
      }
    });
  }

  async request(
    method: string,
    params?: unknown,
    timeoutMs = 30000,
  ): Promise<unknown> {
    if (this.destroyed) {
      throw new Error("MCP client destroyed");
    }

    const id = this.nextId++;
    const msg: JsonRpcRequest = { jsonrpc: "2.0", id, method, params };

    return new Promise((resolve, reject) => {
      const timer = setTimeout(() => {
        this.pending.delete(id);
        reject(new Error(`MCP request timeout: ${method} (${timeoutMs}ms)`));
      }, timeoutMs);

      this.pending.set(id, { resolve, reject, timer });
      this.send(msg);
    });
  }

  notify(method: string, params?: unknown): void {
    if (this.destroyed) {
      return;
    }

    const msg: JsonRpcNotification = { jsonrpc: "2.0", method, params };
    this.send(msg);
  }

  destroy(): void {
    this.destroyed = true;
    for (const [, req] of this.pending) {
      clearTimeout(req.timer);
      req.reject(new Error("MCP client destroyed"));
    }
    this.pending.clear();
  }

  private send(message: JsonRpcRequest | JsonRpcNotification): void {
    if (!this.process.stdin?.writable) {
      return;
    }

    const json = JSON.stringify(message);
    const header = `Content-Length: ${Buffer.byteLength(json)}\r\n\r\n`;
    this.process.stdin.write(header + json);
  }

  private handleData(data: Buffer): void {
    this.buffer += data.toString();

    while (true) {
      const headerEnd = this.buffer.indexOf("\r\n\r\n");
      if (headerEnd === -1) {
        break;
      }

      const header = this.buffer.slice(0, headerEnd);
      const match = header.match(/Content-Length:\s*(\d+)/i);
      if (!match || !match[1]) {
        this.buffer = this.buffer.slice(headerEnd + 4);
        continue;
      }

      const contentLength = Number.parseInt(match[1], 10);
      const bodyStart = headerEnd + 4;
      if (this.buffer.length < bodyStart + contentLength) {
        break;
      }

      const body = this.buffer.slice(bodyStart, bodyStart + contentLength);
      this.buffer = this.buffer.slice(bodyStart + contentLength);

      try {
        const msg = JSON.parse(body) as JsonRpcResponse;
        this.handleMessage(msg);
      } catch (err) {
        logger.warn("Failed to parse MCP message:", err);
      }
    }
  }

  private handleMessage(msg: JsonRpcResponse): void {
    if (msg.id == null) {
      return;
    }

    const pending = this.pending.get(msg.id);
    if (!pending) {
      return;
    }

    this.pending.delete(msg.id);
    clearTimeout(pending.timer);

    if (msg.error) {
      pending.reject(
        new Error(`MCP error ${msg.error.code}: ${msg.error.message}`),
      );
      return;
    }

    pending.resolve(msg.result);
  }
}
