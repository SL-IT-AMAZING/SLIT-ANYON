import { execFile } from "node:child_process";
import { promisify } from "node:util";

import log from "electron-log";
import { z } from "zod";

import type { NativeTool } from "../tool_interface";

const logger = log.scope("tool.ast_grep_replace");
const execFileAsync = promisify(execFile);

const parameters = z.object({
  pattern: z.string(),
  rewrite: z.string(),
  lang: z.string(),
  globs: z.array(z.string()).optional(),
  paths: z.array(z.string()).optional(),
  dryRun: z.boolean().optional(),
});

type AstGrepReplaceInput = z.infer<typeof parameters>;

export const astGrepReplaceTool: NativeTool<AstGrepReplaceInput> = {
  id: "mcp_ast_grep_replace",
  description: "Replace code using ast-grep pattern rewriting",
  parameters,
  riskLevel: "dangerous",
  execute: async (input, ctx) => {
    if (ctx.abort.aborted) {
      throw new Error("Tool execution aborted");
    }

    const args: string[] = [
      "--pattern",
      input.pattern,
      "--rewrite",
      input.rewrite,
      "--lang",
      input.lang,
    ];

    for (const glob of input.globs ?? []) {
      args.push("--globs", glob);
    }

    if (!input.dryRun) {
      args.push("--update-all");
    }

    args.push(...(input.paths ?? [ctx.appPath]));
    logger.debug("Running ast-grep replace", { args, dryRun: input.dryRun });

    try {
      const { stdout, stderr } = await execFileAsync("sg", args, {
        cwd: ctx.appPath,
        signal: ctx.abort,
      });

      const output = [stdout, stderr].filter(Boolean).join("\n").trim();
      return output.length > 0 ? output : "No AST replacements applied";
    } catch (error) {
      logger.error("ast-grep replace failed", error);
      if (ctx.abort.aborted) {
        throw new Error("Tool execution aborted");
      }
      const message = error instanceof Error ? error.message : String(error);
      throw new Error(`ast-grep replace failed: ${message}`);
    }
  },
};
