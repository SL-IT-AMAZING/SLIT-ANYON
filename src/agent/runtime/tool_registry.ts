import { type Tool, type ToolSet, tool } from "ai";

import type { NativeTool, RiskLevel } from "./tool_interface";
import type { ToolContext } from "./types";
import { allNativeTools } from "./tools/index";
import { createBatchTool } from "./tools/batch";

export type { Tool, ToolSet };

export class ToolRegistry {
  private tools = new Map<string, NativeTool>();

  register(t: NativeTool): void {
    if (this.tools.has(t.id)) {
      throw new Error(`Tool "${t.id}" is already registered`);
    }
    this.tools.set(t.id, t);
  }

  registerAll(tools: NativeTool[]): void {
    for (const t of tools) {
      this.register(t);
    }
  }

  get(id: string): NativeTool | undefined {
    return this.tools.get(id);
  }

  has(id: string): boolean {
    return this.tools.has(id);
  }

  list(): NativeTool[] {
    return Array.from(this.tools.values());
  }

  resolveTools(toolIds: string[], ctx: ToolContext): ToolSet {
    const ids = toolIds.length > 0 ? toolIds : Array.from(this.tools.keys());
    const result: ToolSet = {};

    for (const id of ids) {
      const t = this.tools.get(id);
      if (!t) continue;

      result[t.id] = tool({
        description: t.description,
        inputSchema: t.parameters,
        execute: async (input: any) => {
          if (ctx.abort.aborted) {
            throw new Error("Tool execution aborted");
          }

          if (needsConsent(t.riskLevel)) {
            const approved = await ctx.askConsent({
              toolName: t.id,
              toolDescription: t.description,
              riskLevel: t.riskLevel,
              inputPreview: JSON.stringify(input).slice(0, 500),
            });
            if (!approved) {
              throw new Error(`User denied permission for tool "${t.id}"`);
            }
          }

          return t.execute(input, ctx);
        },
      });
    }

    return result;
  }
}

function needsConsent(riskLevel: RiskLevel): boolean {
  switch (riskLevel) {
    case "safe":
      return false;
    case "moderate":
      return false;
    case "dangerous":
      return true;
  }
}

export function createDefaultRegistry(): ToolRegistry {
  const registry = new ToolRegistry();
  registry.registerAll(allNativeTools);
  // Batch tool needs the registry reference (factory pattern)
  registry.register(createBatchTool(registry));
  return registry;
}
