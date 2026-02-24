import { stat } from "node:fs/promises";
import path from "node:path";

import { glob } from "glob";
import { z } from "zod";

import type { NativeTool } from "../tool_interface";
import type { ToolContext } from "../types";

const MAX_RESULTS = 100;

const parameters = z.object({
  pattern: z.string(),
  path: z.string().optional(),
});

type GlobInput = z.infer<typeof parameters>;

function resolvePathFromApp(appPath: string, requestedPath?: string): string {
  const base = path.resolve(appPath);
  const resolved = path.resolve(base, requestedPath ?? ".");
  if (resolved !== base && !resolved.startsWith(base + path.sep)) {
    throw new Error("Path must be within appPath");
  }
  return resolved;
}

export const globTool: NativeTool<GlobInput> = {
  id: "glob",
  description: "Find files by glob pattern",
  parameters,
  riskLevel: "safe",
  execute: async (input: GlobInput, ctx: ToolContext): Promise<string> => {
    if (ctx.abort.aborted) {
      throw new Error("Tool execution aborted");
    }

    const cwd = resolvePathFromApp(ctx.appPath, input.path);
    const matched = await glob(input.pattern, {
      cwd,
      absolute: true,
      dot: true,
      nodir: false,
    });

    const withStats = await Promise.all(
      matched.map(async (filePath) => {
        try {
          const fileStat = await stat(filePath);
          return {
            filePath,
            mtimeMs: fileStat.mtimeMs,
            isDirectory: fileStat.isDirectory(),
          };
        } catch {
          return null;
        }
      }),
    );

    const sorted = withStats
      .filter((entry): entry is NonNullable<typeof entry> => entry !== null)
      .sort((a, b) => b.mtimeMs - a.mtimeMs)
      .slice(0, MAX_RESULTS)
      .map((entry) => {
        const rel = path.relative(cwd, entry.filePath) || ".";
        return entry.isDirectory ? `${rel}/` : rel;
      });

    if (sorted.length === 0) {
      return "No files found";
    }

    return sorted.join("\n");
  },
};
