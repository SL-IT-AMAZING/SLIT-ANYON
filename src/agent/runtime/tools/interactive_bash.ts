import { exec } from "node:child_process";
import { promisify } from "node:util";

import log from "electron-log";
import { z } from "zod";

import type { NativeTool } from "../tool_interface";

const logger = log.scope("tool.interactive_bash");
const execAsync = promisify(exec);

const parameters = z.object({
  tmux_command: z.string(),
});

type InteractiveBashInput = z.infer<typeof parameters>;

export const interactiveBashTool: NativeTool<InteractiveBashInput> = {
  id: "mcp_interactive_bash",
  description: "Run a tmux subcommand for interactive shell control",
  parameters,
  riskLevel: "moderate",
  execute: async (input, ctx) => {
    if (ctx.abort.aborted) {
      throw new Error("Tool execution aborted");
    }

    const command = `tmux ${input.tmux_command}`;
    logger.info("Executing tmux command", { command, appPath: ctx.appPath });

    try {
      const { stdout, stderr } = await execAsync(command, {
        cwd: ctx.appPath,
        signal: ctx.abort,
      });

      const output = [stdout, stderr].filter(Boolean).join("\n").trim();
      return output.length > 0
        ? output
        : "tmux command completed with no output";
    } catch (error) {
      logger.error("tmux command failed", error);
      if (ctx.abort.aborted) {
        throw new Error("Tool execution aborted");
      }
      const message = error instanceof Error ? error.message : String(error);
      throw new Error(`tmux command failed: ${message}`);
    }
  },
};
