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
  execute: async (input, context) => {
    if (!context.backgroundManager) {
      return "BackgroundManager is not available in this runtime.";
    }

    if (input.block) {
      const deadline = Date.now() + (input.timeout ?? 30_000);
      while (Date.now() < deadline) {
        const status = context.backgroundManager.getTaskStatus(input.task_id);
        if (
          status === "completed" ||
          status === "error" ||
          status === "cancelled"
        ) {
          break;
        }
        await new Promise((r) => setTimeout(r, 500));
      }
    }

    const output = context.backgroundManager.getTaskOutput(input.task_id);
    if (!output) {
      return `Task not found: ${input.task_id}`;
    }

    return `# Full Session Output\n\nTask ID: ${output.taskId}\nDescription: ${output.description}\nStatus: ${output.status}\nDuration: ${output.duration ?? 0}ms\n\n## Result\n\n${output.result ?? output.error ?? "No output yet"}`;
  },
};
