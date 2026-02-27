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
  execute: async (input, context) => {
    if (!context.backgroundManager) {
      return "BackgroundManager is not available in this runtime.";
    }

    if (input.all) {
      context.backgroundManager.cancelAll();
      return "All background tasks cancelled.";
    }

    if (input.taskId) {
      context.backgroundManager.cancelTask(input.taskId);
      return `Task ${input.taskId} cancelled.`;
    }

    return "Must provide taskId or set all=true";
  },
};
