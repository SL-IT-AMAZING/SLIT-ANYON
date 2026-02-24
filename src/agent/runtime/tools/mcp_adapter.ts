import { z } from "zod";

import type { NativeTool } from "../tool_interface";

export function createMcpToolAdapter(
  mcpTool: {
    name: string;
    description: string;
    inputSchema: Record<string, unknown>;
  },
  callFn: (toolName: string, args: unknown) => Promise<string>,
): NativeTool {
  return {
    id: `mcp_${mcpTool.name}`,
    description: mcpTool.description,
    parameters: z.record(z.string(), z.unknown()),
    riskLevel: "moderate",
    async execute(input) {
      return callFn(mcpTool.name, input);
    },
  };
}
