import { spawn, type ChildProcess } from "node:child_process";
import * as path from "node:path";

import { z } from "zod";

import type { NativeTool } from "../tool_interface";

const MAX_OUTPUT_BYTES = 50_000;
const DEFAULT_TIMEOUT_MS = 120_000;

const parameters = z.object({
  command: z.string(),
  timeout: z.number().optional(),
  workdir: z.string().optional(),
  description: z.string(),
});

type BashInput = z.infer<typeof parameters>;

function killProcessTree(proc: ChildProcess): void {
  if (!proc.pid) return;

  if (process.platform === "win32") {
    spawn("taskkill", ["/T", "/F", "/PID", String(proc.pid)]);
  } else {
    try {
      process.kill(-proc.pid, "SIGTERM");
    } catch {}
  }
}

function resolveWorkdir(appPath: string, workdir?: string): string {
  if (!workdir) return appPath;
  if (path.isAbsolute(workdir)) return workdir;
  return path.resolve(appPath, workdir);
}

function truncateOutput(text: string): string {
  const bytes = Buffer.byteLength(text, "utf8");
  if (bytes <= MAX_OUTPUT_BYTES) {
    return text;
  }

  let low = 0;
  let high = text.length;
  let cutIndex = 0;
  while (low <= high) {
    const mid = Math.floor((low + high) / 2);
    const slice = text.slice(text.length - mid);
    const size = Buffer.byteLength(slice, "utf8");
    if (size <= MAX_OUTPUT_BYTES) {
      cutIndex = mid;
      low = mid + 1;
    } else {
      high = mid - 1;
    }
  }

  const kept = text.slice(text.length - cutIndex);
  return `[output truncated to last ${MAX_OUTPUT_BYTES} bytes]\n${kept}`;
}

export const bashTool: NativeTool<BashInput> = {
  id: "bash",
  description: "Execute a shell command and return combined output",
  parameters,
  riskLevel: "dangerous",
  execute: async (input, ctx) => {
    if (ctx.abort.aborted) {
      throw new Error("Tool execution aborted");
    }

    const cwd = resolveWorkdir(ctx.appPath, input.workdir);
    const timeoutMs = input.timeout ?? DEFAULT_TIMEOUT_MS;

    const proc = spawn(input.command, {
      shell: true,
      cwd,
      detached: process.platform !== "win32",
      stdio: ["ignore", "pipe", "pipe"],
    });

    const chunks: string[] = [];
    let timedOut = false;
    let aborted = false;

    proc.stdout?.on("data", (data: Buffer | string) => {
      chunks.push(typeof data === "string" ? data : data.toString("utf8"));
    });
    proc.stderr?.on("data", (data: Buffer | string) => {
      chunks.push(typeof data === "string" ? data : data.toString("utf8"));
    });

    const timeoutHandle = setTimeout(() => {
      timedOut = true;
      killProcessTree(proc);
    }, timeoutMs + 100);

    const abortHandler = () => {
      aborted = true;
      killProcessTree(proc);
    };

    ctx.abort.addEventListener("abort", abortHandler);

    const exit = await new Promise<{
      code: number | null;
      signal: NodeJS.Signals | null;
    }>((resolve, reject) => {
      proc.once("error", reject);
      proc.once("exit", (code, signal) => {
        resolve({ code, signal });
      });
    }).finally(() => {
      clearTimeout(timeoutHandle);
      ctx.abort.removeEventListener("abort", abortHandler);
    });

    const output = truncateOutput(chunks.join(""));
    const metadata = [
      `description: ${input.description}`,
      `cwd: ${cwd}`,
      `exitCode: ${String(exit.code)}`,
      `signal: ${String(exit.signal)}`,
      `timedOut: ${String(timedOut)}`,
      `aborted: ${String(aborted)}`,
    ].join("\n");

    if (output.length === 0) {
      return metadata;
    }

    return `${metadata}\n\n${output}`;
  },
};
