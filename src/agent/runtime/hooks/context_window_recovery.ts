/**
 * Context Window Recovery Hook — Auto-compacts when hitting context limit.
 *
 * Detects context-limit errors in the output and signals the runtime
 * to summarize/compact older messages to free up space. This enables
 * graceful recovery rather than hard failure.
 */
import log from "electron-log";

import type { HookHandler, HookRegistry } from "../hook_system";

const logger = log.scope("hook:context-window-recovery");

/** Typed view of the input that may carry error info. */
interface RecoveryInput {
  error?: {
    message?: string;
    code?: string;
    type?: string;
  };
  errorMessage?: string;
}

/** Typed view of the output we may mutate. */
interface RecoveryOutput {
  shouldCompactMessages?: boolean;
  compactReason?: string;
  injectedMessages?: Array<{ role: string; content: string }>;
}

/** Patterns that indicate a context window overflow. */
const CONTEXT_LIMIT_PATTERNS = [
  "context_length_exceeded",
  "maximum context length",
  "token limit",
  "too many tokens",
  "context window",
  "max_tokens",
  "prompt is too long",
];

/** Check if an error message indicates a context window limit was hit. */
function isContextLimitError(input: unknown): boolean {
  const inp = input as RecoveryInput;
  const errorMsg =
    inp.error?.message ?? inp.errorMessage ?? inp.error?.code ?? "";

  if (!errorMsg) return false;

  const lower = errorMsg.toLowerCase();
  return CONTEXT_LIMIT_PATTERNS.some((p) => lower.includes(p));
}

export function registerContextWindowRecoveryHook(
  registry: HookRegistry,
): void {
  const handler: HookHandler = async (input, output, ctx) => {
    if (!isContextLimitError(input)) return;

    logger.warn(
      `[${ctx.sessionId}] Context limit error detected — signaling compaction`,
    );

    const out = output as RecoveryOutput;
    out.shouldCompactMessages = true;
    out.compactReason = "context_limit_exceeded";

    if (!out.injectedMessages) {
      out.injectedMessages = [];
    }

    out.injectedMessages.push({
      role: "system",
      content:
        "[CONTEXT RECOVERY] The context window limit was exceeded. " +
        "Older messages will be summarized to free up space. " +
        "Please continue with the current task.",
    });
  };

  registry.register(
    "agent.step.after",
    "context-window-recovery",
    handler,
    55,
    "session",
  );
}
