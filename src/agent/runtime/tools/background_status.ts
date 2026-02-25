import { z } from "zod";

import type { NativeTool } from "../tool_interface";

const parameters = z.object({});

type BackgroundStatusInput = z.infer<typeof parameters>;

export const backgroundStatusTool: NativeTool<BackgroundStatusInput> = {
  id: "mcp_background_status",
  description: "Get status for all background tasks",
  parameters,
  riskLevel: "safe",
  execute: async () => {
    return "Background status requires BackgroundManager wiring (Phase 9)";
  },
};
