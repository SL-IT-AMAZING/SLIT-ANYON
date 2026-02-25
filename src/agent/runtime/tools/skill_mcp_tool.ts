import { z } from "zod";

import type { NativeTool } from "../tool_interface";

const parameters = z.object({
  mcp_name: z.string(),
  tool_name: z.string().optional(),
  resource_name: z.string().optional(),
  prompt_name: z.string().optional(),
  arguments: z
    .union([z.string(), z.record(z.string(), z.unknown())])
    .optional(),
  grep: z.string().optional(),
});

type SkillMcpToolInput = z.infer<typeof parameters>;

export const skillMcpTool: NativeTool<SkillMcpToolInput> = {
  id: "mcp_skill_mcp",
  description: "Invoke MCP operations exposed by a loaded skill",
  parameters,
  riskLevel: "safe",
  execute: async () => {
    return "Skill MCP invocation requires SkillLoader wiring (Phase 9)";
  },
};
