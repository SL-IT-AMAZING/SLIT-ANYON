import { z } from "zod";

export interface ToolSpec<TInput = any, TOutput = any> {
  name: string;
  description: string;
  inputSchema: z.ZodType<TInput>;
  outputSchema: z.ZodType<TOutput>;
  execute: (input: TInput) => Promise<TOutput>;
}

export function zodToJsonSchema(schema: z.ZodType): Record<string, unknown> {
  return (schema as any).toJSONSchema() as Record<string, unknown>;
}
