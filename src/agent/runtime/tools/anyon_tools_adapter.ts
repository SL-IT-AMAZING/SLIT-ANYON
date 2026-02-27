import type { ToolSpec } from "../../tools/spec";
import type { NativeTool } from "../tool_interface";

export function createAnyonToolAdapters(tools: ToolSpec[]): NativeTool[] {
  return tools.map((tool) => ({
    id: `anyon_${tool.name}`,
    description: tool.description,
    parameters: tool.inputSchema,
    riskLevel: "moderate",
    async execute(input) {
      const result = await tool.execute(input);
      if (typeof result === "string") {
        return result;
      }
      return JSON.stringify(result);
    },
  }));
}
