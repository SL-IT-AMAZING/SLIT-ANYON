import { z } from "zod";

import type { NativeTool } from "../tool_interface";

const parameters = z.object({
  agent_type: z.string(),
  prompt: z.string(),
  description: z.string(),
  run_in_background: z.boolean().optional(),
});

type CallOmoAgentInput = z.infer<typeof parameters>;

export const callOmoAgentTool: NativeTool<CallOmoAgentInput> = {
  id: "mcp_call_agent",
  description: "Invoke an OMO agent directly",
  parameters,
  riskLevel: "safe",
  execute: async () => {
    return "Direct agent invocation requires BackgroundManager wiring (Phase 9)";
  },
};
