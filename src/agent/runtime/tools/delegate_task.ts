import { z } from "zod";

import type { NativeTool } from "../tool_interface";

const parameters = z.object({
  description: z.string(),
  prompt: z.string(),
  category: z.string().optional(),
  load_skills: z.array(z.string()).optional(),
  run_in_background: z.boolean().optional(),
  session_id: z.string().optional(),
  subagent_type: z.string().optional(),
  command: z.string().optional(),
});

type DelegateTaskInput = z.infer<typeof parameters>;

export const delegateTaskTool: NativeTool<DelegateTaskInput> = {
  id: "mcp_task",
  description: "Delegate a task to a sub-agent runtime",
  parameters,
  riskLevel: "safe",
  execute: async () => {
    return "Task delegation requires BackgroundManager wiring (Phase 9)";
  },
};
