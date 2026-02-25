/**
 * Context Window Monitor Hook — Tracks token usage and warns at thresholds.
 *
 * After each agent step, reads token counts from the input/output and
 * warns when usage exceeds 80% of the model's context window. This
 * gives the agent (and user) advance notice before hitting hard limits.
 */
import log from "electron-log";

import type { HookHandler, HookRegistry } from "../hook_system";

const logger = log.scope("hook:context-window-monitor");

/** Known context window sizes by model prefix (in tokens). */
const CONTEXT_WINDOW_SIZES: Record<string, number> = {
  "claude-opus-4": 200_000,
  "claude-sonnet-4": 200_000,
  "claude-3-7-sonnet": 200_000,
  "claude-3-5-sonnet": 200_000,
  "claude-3-opus": 200_000,
  "claude-3-haiku": 200_000,
};

/** Default context window if model is unknown. */
const DEFAULT_CONTEXT_WINDOW = 200_000;

/** Warn when usage exceeds this fraction. */
const WARNING_THRESHOLD = 0.8;

/** Critical warning when usage exceeds this fraction. */
const CRITICAL_THRESHOLD = 0.95;

/** Typed view of the input that may carry token usage. */
interface MonitorInput {
  model?: string;
  usage?: {
    inputTokens?: number;
    outputTokens?: number;
    totalTokens?: number;
  };
}

/** Typed view of the output we may mutate. */
interface MonitorOutput {
  injectedMessages?: Array<{ role: string; content: string }>;
  contextWindowWarning?: "normal" | "warning" | "critical";
}

/** Look up context window size for a model string. */
function getContextWindowSize(model: string): number {
  for (const [prefix, size] of Object.entries(CONTEXT_WINDOW_SIZES)) {
    if (model.includes(prefix)) return size;
  }
  return DEFAULT_CONTEXT_WINDOW;
}

export function registerContextWindowMonitorHook(registry: HookRegistry): void {
  const handler: HookHandler = async (input, output, ctx) => {
    const inp = input as MonitorInput;
    const usage = inp.usage;

    if (!usage) return;

    const totalTokens =
      usage.totalTokens ?? (usage.inputTokens ?? 0) + (usage.outputTokens ?? 0);

    if (totalTokens === 0) return;

    const model = inp.model ?? "unknown";
    const windowSize = getContextWindowSize(model);
    const usageRatio = totalTokens / windowSize;

    const out = output as MonitorOutput;

    if (usageRatio >= CRITICAL_THRESHOLD) {
      out.contextWindowWarning = "critical";

      if (!out.injectedMessages) {
        out.injectedMessages = [];
      }

      out.injectedMessages.push({
        role: "system",
        content:
          `[CONTEXT WINDOW CRITICAL] Token usage at ${Math.round(usageRatio * 100)}% ` +
          `(${totalTokens.toLocaleString()} / ${windowSize.toLocaleString()}). ` +
          "Consider summarizing the conversation or compacting context immediately.",
      });

      logger.warn(
        `[${ctx.sessionId}] Context window CRITICAL: ${Math.round(usageRatio * 100)}%`,
      );
    } else if (usageRatio >= WARNING_THRESHOLD) {
      out.contextWindowWarning = "warning";

      if (!out.injectedMessages) {
        out.injectedMessages = [];
      }

      out.injectedMessages.push({
        role: "system",
        content:
          `[CONTEXT WINDOW WARNING] Token usage at ${Math.round(usageRatio * 100)}% ` +
          `(${totalTokens.toLocaleString()} / ${windowSize.toLocaleString()}). ` +
          "Be mindful of context limits.",
      });

      logger.log(
        `[${ctx.sessionId}] Context window warning: ${Math.round(usageRatio * 100)}%`,
      );
    } else {
      out.contextWindowWarning = "normal";
    }
  };

  registry.register(
    "agent.step.after",
    "context-window-monitor",
    handler,
    50,
    "session",
  );
}
