import { z } from "zod";

import type { NativeTool } from "../tool_interface";
import type { ToolContext } from "../types";

const EXA_MCP_URL = "https://mcp.exa.ai/mcp";
const TIMEOUT_MS = 25_000;

const parameters = z.object({
  query: z.string(),
  numResults: z.number().optional(),
  livecrawl: z.enum(["fallback", "preferred"]).optional(),
  type: z.enum(["auto", "fast", "deep"]).optional(),
  contextMaxCharacters: z.number().optional(),
});

type WebSearchInput = z.infer<typeof parameters>;

function parseSseDataLines(body: string): string {
  const dataLines = body
    .split(/\r?\n/)
    .filter((line) => line.startsWith("data: "))
    .map((line) => line.slice(6).trim())
    .filter((line) => line.length > 0 && line !== "[DONE]");

  const parsed = dataLines
    .map((line) => {
      try {
        return JSON.parse(line) as {
          error?: { message?: string };
          result?: {
            content?: Array<{ type?: string; text?: string }>;
          };
        };
      } catch {
        return null;
      }
    })
    .filter((item): item is NonNullable<typeof item> => item !== null);

  for (const item of parsed) {
    if (item.error) {
      throw new Error(item.error.message ?? "Exa MCP request failed");
    }
  }

  const textChunks: string[] = [];
  for (const item of parsed) {
    const content = item.result?.content;
    if (!Array.isArray(content)) {
      continue;
    }
    for (const chunk of content) {
      if (chunk.type === "text" && typeof chunk.text === "string") {
        textChunks.push(chunk.text);
      }
    }
  }

  if (textChunks.length > 0) {
    return textChunks.join("\n");
  }

  return dataLines.join("\n");
}

async function callExaWebSearch(
  input: WebSearchInput,
  ctx: ToolContext,
): Promise<string> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), TIMEOUT_MS);
  const signal = AbortSignal.any([controller.signal, ctx.abort]);

  try {
    const response = await fetch(EXA_MCP_URL, {
      method: "POST",
      headers: {
        "content-type": "application/json",
      },
      body: JSON.stringify({
        jsonrpc: "2.0",
        id: `websearch-${Date.now()}`,
        method: "tools/call",
        params: {
          name: "web_search_exa",
          arguments: input,
        },
      }),
      signal,
    });

    const raw = await response.text();

    if (!response.ok) {
      throw new Error(`Exa MCP request failed (${response.status}): ${raw}`);
    }

    return parseSseDataLines(raw);
  } catch (error) {
    if (ctx.abort.aborted) {
      throw new Error("Tool execution aborted");
    }
    if (controller.signal.aborted) {
      throw new Error("Web search request timed out");
    }
    throw error;
  } finally {
    clearTimeout(timeout);
  }
}

export const websearchTool: NativeTool<WebSearchInput> = {
  id: "websearch",
  description: "Search the web via Exa API",
  parameters,
  riskLevel: "moderate",
  async execute(input, ctx) {
    return callExaWebSearch(input, ctx);
  },
};
