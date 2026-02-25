import { z } from "zod";

import type { NativeTool } from "../tool_interface";

const parameters = z.object({
  taskId: z.string().optional(),
  all: z.boolean().optional(),
});

type BackgroundCancelInput = z.infer<typeof parameters>;

export const backgroundCancelTool: NativeTool<BackgroundCancelInput> = {
  id: "mcp_background_cancel",
  description: "Cancel one or more background tasks",
  parameters,
  riskLevel: "safe",
  execute: async () => {
    return "Background cancellation requires BackgroundManager wiring (Phase 9)";
  },
};
