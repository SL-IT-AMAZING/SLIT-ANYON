import { execFile } from "node:child_process";
import { stat } from "node:fs/promises";
import { promisify } from "node:util";
import path from "node:path";

import { z } from "zod";

import type { NativeTool } from "../tool_interface";
import type { ToolContext } from "../types";

const execFileAsync = promisify(execFile);
const MAX_RESULTS = 100;

const parameters = z.object({
  pattern: z.string(),
  path: z.string().optional(),
  include: z.string().optional(),
});

type GrepInput = z.infer<typeof parameters>;

type Match = {
  file: string;
  line: number;
  content: string;
  mtimeMs: number;
};

function resolvePathFromApp(appPath: string, requestedPath?: string): string {
  const base = path.resolve(appPath);
  const resolved = path.resolve(base, requestedPath ?? ".");
  if (resolved !== base && !resolved.startsWith(base + path.sep)) {
    throw new Error("Path must be within appPath");
  }
  return resolved;
}

async function runSearch(cwd: string, input: GrepInput): Promise<string> {
  const grepArgs = ["-rnH", "--binary-files=without-match"];
  if (input.include) {
    grepArgs.push(`--include=${input.include}`);
  }
  grepArgs.push(input.pattern, ".");

  try {
    const result = await execFileAsync("grep", grepArgs, {
      cwd,
      maxBuffer: 10 * 1024 * 1024,
    });
    return result.stdout;
  } catch (error: any) {
    if (error?.code === "ENOENT") {
      const rgArgs = ["-n", "--no-heading", "--color", "never"];
      if (input.include) {
        rgArgs.push("-g", input.include);
      }
      rgArgs.push(input.pattern, ".");
      const result = await execFileAsync("rg", rgArgs, {
        cwd,
        maxBuffer: 10 * 1024 * 1024,
      });
      return result.stdout;
    }
    if (typeof error?.code === "number" && error.code === 1) {
      return "";
    }
    throw error;
  }
}

async function parseMatches(raw: string, cwd: string): Promise<Match[]> {
  const lines = raw.split(/\r?\n/).filter((line) => line.length > 0);
  const parsed = lines
    .map((line) => {
      const match = line.match(/^(.*?):(\d+):(.*)$/);
      if (!match) {
        return null;
      }
      return {
        file: match[1],
        line: Number.parseInt(match[2], 10),
        content: match[3],
      };
    })
    .filter((entry): entry is NonNullable<typeof entry> => entry !== null);

  const withMtime = await Promise.all(
    parsed.map(async (entry) => {
      const absolutePath = path.resolve(cwd, entry.file);
      try {
        const fileStat = await stat(absolutePath);
        return {
          ...entry,
          file: path.relative(cwd, absolutePath) || ".",
          mtimeMs: fileStat.mtimeMs,
        };
      } catch {
        return null;
      }
    }),
  );

  return withMtime.filter((entry): entry is Match => entry !== null);
}

export const grepTool: NativeTool<GrepInput> = {
  id: "grep",
  description: "Search file contents using a regex pattern",
  parameters,
  riskLevel: "safe",
  execute: async (input: GrepInput, ctx: ToolContext): Promise<string> => {
    if (ctx.abort.aborted) {
      throw new Error("Tool execution aborted");
    }

    const cwd = resolvePathFromApp(ctx.appPath, input.path);
    const output = await runSearch(cwd, input);
    const matches = await parseMatches(output, cwd);

    if (matches.length === 0) {
      return "No matches found";
    }

    const sorted = matches
      .sort((a, b) => {
        if (b.mtimeMs !== a.mtimeMs) {
          return b.mtimeMs - a.mtimeMs;
        }
        if (a.file !== b.file) {
          return a.file.localeCompare(b.file);
        }
        return a.line - b.line;
      })
      .slice(0, MAX_RESULTS);

    const grouped = new Map<string, Match[]>();
    for (const item of sorted) {
      const list = grouped.get(item.file);
      if (list) {
        list.push(item);
      } else {
        grouped.set(item.file, [item]);
      }
    }

    const sections: string[] = [`Found ${sorted.length} matches`, ""];
    for (const [file, fileMatches] of grouped.entries()) {
      sections.push(`${file}:`);
      for (const item of fileMatches) {
        sections.push(`  Line ${item.line}: ${item.content}`);
      }
      sections.push("");
    }

    return sections.join("\n").trimEnd();
  },
};
