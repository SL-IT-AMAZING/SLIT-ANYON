import { z } from "zod";

import type { NativeTool } from "../tool_interface";

const parameters = z.object({
  task_id: z.string(),
  full_session: z.boolean().optional(),
  block: z.boolean().optional(),
  timeout: z.number().optional(),
  message_limit: z.number().optional(),
  include_thinking: z.boolean().optional(),
  include_tool_results: z.boolean().optional(),
  since_message_id: z.string().optional(),
  thinking_max_chars: z.number().optional(),
});

type BackgroundOutputInput = z.infer<typeof parameters>;

export const backgroundOutputTool: NativeTool<BackgroundOutputInput> = {
  id: "mcp_background_output",
  description: "Get output for a background task",
  parameters,
  riskLevel: "safe",
  execute: async () => {
    return "Background output requires BackgroundManager wiring (Phase 9)";
  },
};
