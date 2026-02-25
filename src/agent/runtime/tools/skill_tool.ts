import { z } from "zod";

import type { NativeTool } from "../tool_interface";

const parameters = z.object({
  name: z.string(),
  user_message: z.string().optional(),
});

type SkillToolInput = z.infer<typeof parameters>;

export const skillTool: NativeTool<SkillToolInput> = {
  id: "mcp_skill",
  description: "Load a skill by name and apply it",
  parameters,
  riskLevel: "safe",
  execute: async () => {
    return "Skill loading requires SkillLoader wiring (Phase 9)";
  },
};
