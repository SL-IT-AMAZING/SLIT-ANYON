import type { z } from "zod";

import type { ToolContext } from "./types";

export type RiskLevel = "safe" | "moderate" | "dangerous";

export interface NativeTool<TInput = any> {
  id: string;
  description: string;
  parameters: z.ZodType<TInput>;
  riskLevel: RiskLevel;
  execute: (input: TInput, ctx: ToolContext) => Promise<string>;
}
