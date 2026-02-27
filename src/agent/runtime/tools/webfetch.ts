import TurndownService from "turndown";
import { z } from "zod";

import type { NativeTool } from "../tool_interface";

const DEFAULT_TIMEOUT_SECONDS = 30;
const MAX_TIMEOUT_SECONDS = 120;
const MAX_BYTES = 5 * 1024 * 1024;

const parameters = z.object({
  url: z.string(),
  format: z.enum(["text", "markdown", "html"]).default("markdown"),
  timeout: z.number().optional(),
});

type WebFetchInput = z.infer<typeof parameters>;

function clampTimeoutSeconds(timeout?: number): number {
  const resolved = timeout ?? DEFAULT_TIMEOUT_SECONDS;
  if (!Number.isFinite(resolved) || resolved <= 0) {
    return DEFAULT_TIMEOUT_SECONDS;
  }
  return Math.min(resolved, MAX_TIMEOUT_SECONDS);
}

function looksLikeHtml(contentType: string | null, body: string): boolean {
  if (contentType?.toLowerCase().includes("text/html")) {
    return true;
  }
  return /<\s*(html|body|head|div|p|article|section|main|h1|h2|h3)\b/i.test(
    body,
  );
}

function stripHtml(body: string): string {
  const withoutScripts = body.replace(
    /<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi,
    " ",
  );
  const withoutStyles = withoutScripts.replace(
    /<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi,
    " ",
  );
  const withoutTags = withoutStyles.replace(/<[^>]+>/g, " ");
  return withoutTags.replace(/\s+/g, " ").trim();
}

async function readBodyWithLimit(response: Response): Promise<string> {
  if (!response.body) {
    return "";
  }

  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  const chunks: string[] = [];
  let total = 0;

  try {
    // eslint-disable-next-line no-constant-condition
    while (true) {
      const result = await reader.read();
      if (result.done) {
        break;
      }
      total += result.value.byteLength;
      if (total > MAX_BYTES) {
        throw new Error("Response body exceeds 5MB limit");
      }
      chunks.push(decoder.decode(result.value, { stream: true }));
    }
    chunks.push(decoder.decode());
  } finally {
    reader.releaseLock();
  }

  return chunks.join("");
}

export const webfetchTool: NativeTool<WebFetchInput> = {
  id: "webfetch",
  description: "Fetch a web page and return text, markdown, or html",
  parameters,
  riskLevel: "moderate",
  async execute(input, ctx) {
    const timeoutSeconds = clampTimeoutSeconds(input.timeout);
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), timeoutSeconds * 1000);
    const signal = AbortSignal.any([controller.signal, ctx.abort]);

    try {
      const response = await fetch(input.url, {
        method: "GET",
        headers: {
          "user-agent":
            "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
          accept:
            "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
        },
        signal,
      });

      const body = await readBodyWithLimit(response);

      if (!response.ok) {
        throw new Error(
          `Failed to fetch URL (${response.status} ${response.statusText})`,
        );
      }

      if (input.format === "html") {
        return body;
      }

      const htmlLike = looksLikeHtml(
        response.headers.get("content-type"),
        body,
      );

      if (input.format === "text") {
        return htmlLike ? stripHtml(body) : body;
      }

      if (!htmlLike) {
        return body;
      }

      const turndown = new TurndownService();
      return turndown.turndown(body);
    } catch (error) {
      if (ctx.abort.aborted) {
        throw new Error("Tool execution aborted");
      }
      if (controller.signal.aborted) {
        throw new Error("Web fetch request timed out");
      }
      throw error;
    } finally {
      clearTimeout(timeout);
    }
  },
};
