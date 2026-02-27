import { readdir, stat } from "node:fs/promises";
import path from "node:path";

import { z } from "zod";

import type { NativeTool } from "../tool_interface";
import type { ToolContext } from "../types";

const MAX_FILES = 100;
const DEFAULT_IGNORES = [
  "node_modules",
  ".git",
  "dist",
  "build",
  "__pycache__",
  ".venv",
  ".idea",
  ".next",
  ".cache",
  "coverage",
];

const parameters = z.object({
  path: z.string().optional(),
  ignore: z.array(z.string()).optional(),
});

type ListInput = z.infer<typeof parameters>;

function resolvePathFromApp(appPath: string, requestedPath?: string): string {
  const base = path.resolve(appPath);
  const resolved = path.resolve(base, requestedPath ?? ".");
  if (resolved !== base && !resolved.startsWith(base + path.sep)) {
    throw new Error("Path must be within appPath");
  }
  return resolved;
}

function wildcardToRegex(pattern: string): RegExp {
  const escaped = pattern.replace(/[.+^${}()|[\]\\]/g, "\\$&");
  const regex = escaped.replace(/\*/g, ".*");
  return new RegExp(`^${regex}$`);
}

function shouldIgnore(
  relativePath: string,
  name: string,
  ignorePatterns: string[],
): boolean {
  const candidates = [name, relativePath, relativePath.replace(/\\/g, "/")];
  for (const pattern of ignorePatterns) {
    if (pattern.includes("*")) {
      const regex = wildcardToRegex(pattern);
      if (candidates.some((candidate) => regex.test(candidate))) {
        return true;
      }
    } else if (
      candidates.some(
        (candidate) =>
          candidate === pattern || candidate.startsWith(`${pattern}/`),
      )
    ) {
      return true;
    }
  }
  return false;
}

export const listTool: NativeTool<ListInput> = {
  id: "list",
  description: "List files and directories recursively",
  parameters,
  riskLevel: "safe",
  execute: async (input: ListInput, ctx: ToolContext): Promise<string> => {
    if (ctx.abort.aborted) {
      throw new Error("Tool execution aborted");
    }

    const root = resolvePathFromApp(ctx.appPath, input.path);
    const rootStat = await stat(root);
    const ignorePatterns = [...DEFAULT_IGNORES, ...(input.ignore ?? [])];
    const treeLines: string[] = [path.basename(root) || "."];
    let fileCount = 0;

    const walk = async (dirPath: string, depth: number): Promise<void> => {
      if (fileCount >= MAX_FILES) {
        return;
      }

      const entries = await readdir(dirPath, { withFileTypes: true });
      entries.sort((a, b) => {
        if (a.isDirectory() !== b.isDirectory()) {
          return a.isDirectory() ? -1 : 1;
        }
        return a.name.localeCompare(b.name);
      });

      for (const entry of entries) {
        if (fileCount >= MAX_FILES) {
          return;
        }

        const fullPath = path.join(dirPath, entry.name);
        const rel = path.relative(root, fullPath).replace(/\\/g, "/");

        if (shouldIgnore(rel, entry.name, ignorePatterns)) {
          continue;
        }

        const indent = "  ".repeat(depth);
        if (entry.isDirectory()) {
          treeLines.push(`${indent}${entry.name}/`);
          await walk(fullPath, depth + 1);
        } else {
          treeLines.push(`${indent}${entry.name}`);
          fileCount += 1;
        }
      }
    };

    if (rootStat.isDirectory()) {
      await walk(root, 1);
    } else {
      treeLines.push(`  ${path.basename(root)}`);
      fileCount = 1;
    }

    if (fileCount === 0) {
      return "No files found";
    }

    return treeLines.join("\n");
  },
};
