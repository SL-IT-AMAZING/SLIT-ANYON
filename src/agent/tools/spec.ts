import { z } from "zod";

// Lightweight tool spec; no AgentContext dependency (Local Agent + MCP).
export interface ToolSpec<TInput = any, TOutput = any> {
  name: string;
  description: string;
  inputSchema: z.ZodType<TInput>;
  outputSchema: z.ZodType<TOutput>;
  execute: (input: TInput) => Promise<TOutput>;
}
