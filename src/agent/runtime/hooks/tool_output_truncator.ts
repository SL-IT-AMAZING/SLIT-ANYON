/**
 * Tool Output Truncator Hook — Truncates oversized tool output.
 *
 * After a tool execution, checks the output size and truncates it
 * if it exceeds the configured maximum. This prevents oversized tool
 * results from blowing up the context window.
 */
import log from "electron-log";

import type { HookHandler, HookRegistry } from "../hook_system";

const logger = log.scope("hook:tool-output-truncator");

/** Maximum output size in bytes before truncation. */
const MAX_OUTPUT_BYTES = 50_000;

/** Maximum number of lines before truncation. */
const MAX_OUTPUT_LINES = 2_000;

/** Typed view of the input/output for tool execution. */
interface TruncatorInput {
  toolName?: string;
}

interface TruncatorOutput {
  toolResult?: string;
  truncated?: boolean;
  originalSize?: number;
}

export function registerToolOutputTruncatorHook(registry: HookRegistry): void {
  const handler: HookHandler = async (input, output, ctx) => {
    const out = output as TruncatorOutput;
    const result = out.toolResult;

    if (typeof result !== "string") return;

    const byteSize = Buffer.byteLength(result, "utf-8");
    const lineCount = result.split("\n").length;

    const needsTruncation =
      byteSize > MAX_OUTPUT_BYTES || lineCount > MAX_OUTPUT_LINES;

    if (!needsTruncation) return;

    const inp = input as TruncatorInput;
    const toolName = inp.toolName ?? "unknown";

    logger.log(
      `[${ctx.sessionId}] Truncating ${toolName} output: ${byteSize} bytes, ${lineCount} lines`,
    );

    out.originalSize = byteSize;
    out.truncated = true;

    // Truncate by bytes first, then by lines
    let truncated = result;

    if (byteSize > MAX_OUTPUT_BYTES) {
      // Simple character-based truncation (approximate byte equivalence for UTF-8)
      truncated = truncated.slice(0, MAX_OUTPUT_BYTES);
    }

    const lines = truncated.split("\n");
    if (lines.length > MAX_OUTPUT_LINES) {
      truncated = lines.slice(0, MAX_OUTPUT_LINES).join("\n");
    }

    out.toolResult =
      truncated +
      `\n\n... (truncated from ${byteSize.toLocaleString()} bytes / ${lineCount.toLocaleString()} lines)`;
  };

  registry.register(
    "tool.execute.after",
    "tool-output-truncator",
    handler,
    10,
    "global",
  );
}
