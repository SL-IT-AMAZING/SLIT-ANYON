import { open, readFile, readdir, stat } from "node:fs/promises";
import path from "node:path";

import { z } from "zod";

import type { NativeTool } from "../tool_interface";
import type { ToolContext } from "../types";

const MAX_LINES = 2000;
const MAX_BYTES = 50 * 1024;

const parameters = z.object({
  filePath: z.string(),
  offset: z.coerce.number().optional(),
  limit: z.coerce.number().optional(),
});

type ReadInput = z.infer<typeof parameters>;

function resolvePathFromApp(appPath: string, filePath: string): string {
  const base = path.resolve(appPath);
  const resolved = path.resolve(base, filePath);
  if (resolved !== base && !resolved.startsWith(base + path.sep)) {
    throw new Error("Path must be within appPath");
  }
  return resolved;
}

async function isBinaryFile(filePath: string): Promise<boolean> {
  const handle = await open(filePath, "r");
  try {
    const buffer = Buffer.alloc(4096);
    const result = await handle.read(buffer, 0, 4096, 0);
    const chunk = buffer.subarray(0, result.bytesRead);
    return chunk.includes(0);
  } finally {
    await handle.close();
  }
}

function formatNumberedLines(
  lines: string[],
  offset: number,
  limit: number,
): string[] {
  const start = Math.max(0, offset);
  const cappedLimit = Math.max(0, Math.min(limit, MAX_LINES));
  const selected = lines.slice(start, start + cappedLimit);

  const formatted: string[] = [];
  let totalBytes = 0;

  for (let i = 0; i < selected.length; i += 1) {
    const lineNumber = String(start + i + 1).padStart(5, "0");
    const outputLine = `${lineNumber}| ${selected[i]}`;
    const lineBytes = Buffer.byteLength(outputLine + "\n", "utf8");

    if (totalBytes + lineBytes > MAX_BYTES) {
      break;
    }

    formatted.push(outputLine);
    totalBytes += lineBytes;
  }

  return formatted;
}

function toFileOutput(lines: string[], totalLines: number): string {
  const body = lines.join("\n");
  const withBody = body.length > 0 ? `${body}\n` : "";
  return `<file>\n${withBody}(End of file - total ${totalLines} lines)\n</file>`;
}

export const readTool: NativeTool<ReadInput> = {
  id: "read",
  description: "Read a file or directory with line numbers",
  parameters,
  riskLevel: "safe",
  execute: async (input: ReadInput, ctx: ToolContext): Promise<string> => {
    if (ctx.abort.aborted) {
      throw new Error("Tool execution aborted");
    }

    const targetPath = resolvePathFromApp(ctx.appPath, input.filePath);
    const targetStat = await stat(targetPath);

    if (targetStat.isDirectory()) {
      const entries = await readdir(targetPath, { withFileTypes: true });
      const names = entries
        .map((entry) => (entry.isDirectory() ? `${entry.name}/` : entry.name))
        .sort((a, b) => a.localeCompare(b));
      const numbered = formatNumberedLines(
        names,
        input.offset ?? 0,
        input.limit ?? MAX_LINES,
      );
      return toFileOutput(numbered, names.length);
    }

    if (await isBinaryFile(targetPath)) {
      return `<file>\nBinary file not shown\n</file>`;
    }

    const raw = await readFile(targetPath, "utf8");
    const lines = raw.length === 0 ? [] : raw.split(/\r?\n/);
    const numbered = formatNumberedLines(
      lines,
      input.offset ?? 0,
      input.limit ?? MAX_LINES,
    );
    return toFileOutput(numbered, lines.length);
  },
};
