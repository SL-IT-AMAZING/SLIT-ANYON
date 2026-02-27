import { z } from "zod";

import type { NativeTool } from "../tool_interface";

const parameters = z.object({
  name: z.string(),
  user_message: z.string().optional(),
});

type SlashCommandToolInput = z.infer<typeof parameters>;

export const slashcommandTool: NativeTool<SlashCommandToolInput> = {
  id: "mcp_slashcommand",
  description: "Execute a slash command",
  parameters,
  riskLevel: "safe",
  execute: async () => {
    return "Slash command execution requires CommandRegistry wiring (Phase 9)";
  },
};
