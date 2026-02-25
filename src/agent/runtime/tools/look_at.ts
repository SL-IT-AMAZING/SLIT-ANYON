import { z } from "zod";

import type { NativeTool } from "../tool_interface";

const parameters = z.object({
  file_path: z.string().optional(),
  image_data: z.string().optional(),
  goal: z.string(),
});

type LookAtInput = z.infer<typeof parameters>;

export const lookAtTool: NativeTool<LookAtInput> = {
  id: "mcp_look_at",
  description: "Analyze media files and return extracted insights",
  parameters,
  riskLevel: "safe",
  execute: async () => {
    return "Media analysis requires multimodal model wiring (Phase 9)";
  },
};
