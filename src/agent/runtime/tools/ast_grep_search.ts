import { execFile } from "node:child_process";
import { promisify } from "node:util";

import log from "electron-log";
import { z } from "zod";

import type { NativeTool } from "../tool_interface";

const logger = log.scope("tool.ast_grep_search");
const execFileAsync = promisify(execFile);

const parameters = z.object({
  pattern: z.string(),
  lang: z.string(),
  globs: z.array(z.string()).optional(),
  paths: z.array(z.string()).optional(),
  context: z.number().optional(),
});

type AstGrepSearchInput = z.infer<typeof parameters>;

export const astGrepSearchTool: NativeTool<AstGrepSearchInput> = {
  id: "mcp_ast_grep_search",
  description: "Search code using ast-grep pattern matching",
  parameters,
  riskLevel: "safe",
  execute: async (input, ctx) => {
    if (ctx.abort.aborted) {
      throw new Error("Tool execution aborted");
    }

    const args: string[] = ["--pattern", input.pattern, "--lang", input.lang];

    if (typeof input.context === "number") {
      args.push("--context", String(input.context));
    }

    for (const glob of input.globs ?? []) {
      args.push("--globs", glob);
    }

    args.push(...(input.paths ?? [ctx.appPath]));
    logger.debug("Running ast-grep search", { args });

    try {
      const { stdout, stderr } = await execFileAsync("sg", args, {
        cwd: ctx.appPath,
        signal: ctx.abort,
      });

      const output = [stdout, stderr].filter(Boolean).join("\n").trim();
      return output.length > 0 ? output : "No AST matches found";
    } catch (error) {
      logger.error("ast-grep search failed", error);
      if (ctx.abort.aborted) {
        throw new Error("Tool execution aborted");
      }
      const message = error instanceof Error ? error.message : String(error);
      throw new Error(`ast-grep search failed: ${message}`);
    }
  },
};
