/**
 * Think Mode Hook — Enables extended thinking for supported models.
 *
 * Checks whether the current model supports extended thinking blocks
 * and, if so, adds the appropriate thinking configuration to the
 * message payload so the API returns detailed reasoning traces.
 */
import log from "electron-log";

import type { HookHandler, HookRegistry } from "../hook_system";

const logger = log.scope("hook:think-mode");

/** Models that support extended thinking. */
const THINKING_CAPABLE_MODELS = new Set([
  "claude-sonnet-4-20250514",
  "claude-opus-4-20250514",
  "claude-3-7-sonnet-20250219",
  "claude-3-7-sonnet-latest",
  "claude-sonnet-4-latest",
  "claude-opus-4-latest",
]);

/** Typed view of input that may carry model info. */
interface ThinkModeInput {
  model?: string;
  thinkingEnabled?: boolean;
  thinkingBudget?: number;
}

/** Typed view of the output we may mutate. */
interface ThinkModeOutput {
  thinkingEnabled?: boolean;
  thinkingBudget?: number;
}

/** Check if a model name indicates thinking capability. */
function supportsThinking(model: string): boolean {
  if (THINKING_CAPABLE_MODELS.has(model)) return true;
  // Also match partial names like "claude-3-7-sonnet" or "claude-opus-4"
  return (
    model.includes("claude-3-7") ||
    model.includes("claude-sonnet-4") ||
    model.includes("claude-opus-4")
  );
}

export function registerThinkModeHook(registry: HookRegistry): void {
  const handler: HookHandler = async (input, output, ctx) => {
    const inp = input as ThinkModeInput;

    // If thinking is explicitly disabled, don't override
    if (inp.thinkingEnabled === false) return;

    const model = inp.model;
    if (!model || typeof model !== "string") return;

    if (!supportsThinking(model)) return;

    const out = output as ThinkModeOutput;

    // Only set if not already configured
    if (out.thinkingEnabled === undefined) {
      out.thinkingEnabled = true;
      logger.log(`[${ctx.sessionId}] Enabled thinking mode for model ${model}`);
    }

    // Set default thinking budget if not already specified
    if (out.thinkingBudget === undefined && !inp.thinkingBudget) {
      out.thinkingBudget = 10_000;
    }
  };

  registry.register("messages.transform", "think-mode", handler, 5, "global");
}
