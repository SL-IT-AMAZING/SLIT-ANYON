import { z } from "zod";

import type { NativeTool } from "../tool_interface";
import type { ToolRegistry } from "../tool_registry";
import type { ToolContext } from "../types";

const MAX_BATCH_CALLS = 25;

export function createBatchTool(registry: ToolRegistry): NativeTool<{
  tool_calls: Array<{ tool: string; parameters: Record<string, unknown> }>;
}> {
  return {
    id: "batch",
    description: `Execute multiple tool calls in parallel for optimal performance. Use this when you need to run several independent operations simultaneously. Maximum ${MAX_BATCH_CALLS} tool calls per batch. Tools that cannot be batched: batch itself. Each tool call runs independently — if one fails, others still complete.`,
    parameters: z.object({
      tool_calls: z.array(
        z.object({
          tool: z.string().describe("The name of the tool to execute"),
          parameters: z
            .record(z.string(), z.unknown())
            .describe("Parameters for the tool"),
        }),
      ),
    }),
    riskLevel: "safe",
    async execute(
      input: {
        tool_calls: Array<{
          tool: string;
          parameters: Record<string, unknown>;
        }>;
      },
      context: ToolContext,
    ): Promise<string> {
      const toolCalls = input.tool_calls ?? [];

      if (toolCalls.length === 0) {
        return "Error: No tool calls provided. Provide at least one tool call.";
      }

      const activeCalls = toolCalls.slice(0, MAX_BATCH_CALLS);
      const discarded = toolCalls.slice(MAX_BATCH_CALLS);

      type BatchResult =
        | { tool: string; success: true; output: string }
        | { tool: string; success: false; error: string };

      const results = await Promise.all(
        activeCalls.map(async (call): Promise<BatchResult> => {
          try {
            if (call.tool === "batch") {
              return {
                tool: call.tool,
                success: false,
                error: "Cannot nest batch calls",
              };
            }

            const nativeTool = registry.get(call.tool);
            if (!nativeTool) {
              return {
                tool: call.tool,
                success: false,
                error: `Tool '${call.tool}' not found in registry`,
              };
            }

            const parsed = nativeTool.parameters.parse(call.parameters);
            const result = await nativeTool.execute(parsed, context);
            return {
              tool: call.tool,
              success: true,
              output:
                typeof result === "string" ? result : JSON.stringify(result),
            };
          } catch (err) {
            return {
              tool: call.tool,
              success: false,
              error: err instanceof Error ? err.message : String(err),
            };
          }
        }),
      );

      const allResults: BatchResult[] = [...results];
      for (const call of discarded) {
        allResults.push({
          tool: call.tool,
          success: false,
          error: `Maximum of ${MAX_BATCH_CALLS} tools allowed in batch`,
        });
      }

      const successful = allResults.filter((r) => r.success).length;
      const failed = allResults.length - successful;

      let output =
        failed > 0
          ? `Executed ${successful}/${allResults.length} tools successfully. ${failed} failed.`
          : `All ${successful} tools executed successfully.\n\nKeep using the batch tool for optimal performance!`;

      output += "\n\n--- Results ---\n";
      for (const r of allResults) {
        if (r.success) {
          output += `\n✅ ${r.tool}: ${(r as { tool: string; success: true; output: string }).output.substring(0, 500)}`;
        } else {
          output += `\n❌ ${r.tool}: ${(r as { tool: string; success: false; error: string }).error}`;
        }
      }

      return output;
    },
  };
}
