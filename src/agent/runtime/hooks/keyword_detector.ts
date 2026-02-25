/**
 * Keyword Detector Hook — Detects keywords in user messages for auto-actions.
 *
 * Performs simple pattern matching on incoming chat messages to detect
 * special keywords or phrases that may trigger automatic behaviors
 * (e.g., activating ralph-loop, triggering planning mode).
 */
import log from "electron-log";

import type { HookHandler, HookRegistry } from "../hook_system";

const logger = log.scope("hook:keyword-detector");

/** A keyword pattern and its associated action tag. */
interface KeywordRule {
  /** RegExp pattern to match against the message. */
  pattern: RegExp;
  /** Action tag to set in the output when matched. */
  action: string;
  /** Human-readable label for logging. */
  label: string;
}

/** Built-in keyword rules. */
const KEYWORD_RULES: KeywordRule[] = [
  {
    pattern: /\bralph[- ]?loop\b/i,
    action: "activate-ralph-loop",
    label: "Ralph Loop activation",
  },
  {
    pattern: /\bultrawork\b/i,
    action: "activate-ultrawork",
    label: "Ultrawork mode",
  },
  {
    pattern: /\b(don'?t stop|keep going|continue until|must complete)\b/i,
    action: "activate-ralph-loop",
    label: "Completion emphasis (implicit ralph-loop)",
  },
  {
    pattern: /\b(plan first|create a plan|planning session)\b/i,
    action: "activate-planning",
    label: "Planning mode",
  },
  {
    pattern: /\bdeep\s*search\b/i,
    action: "activate-deepsearch",
    label: "Deep search mode",
  },
];

/** Typed view of the input from a chat message. */
interface KeywordInput {
  message?: string;
  content?: string;
}

/** Typed view of the output we may mutate. */
interface KeywordOutput {
  detectedKeywords?: string[];
  detectedActions?: string[];
}

export function registerKeywordDetectorHook(registry: HookRegistry): void {
  const handler: HookHandler = async (input, output, ctx) => {
    const inp = input as KeywordInput;
    const text = inp.message ?? inp.content;

    if (typeof text !== "string" || !text.trim()) return;

    const out = output as KeywordOutput;
    const matchedActions: string[] = [];
    const matchedKeywords: string[] = [];

    for (const rule of KEYWORD_RULES) {
      if (rule.pattern.test(text)) {
        matchedActions.push(rule.action);
        matchedKeywords.push(rule.label);
      }
    }

    if (matchedActions.length > 0) {
      out.detectedKeywords = matchedKeywords;
      out.detectedActions = matchedActions;

      logger.log(
        `[${ctx.sessionId}] Detected keywords: ${matchedKeywords.join(", ")}`,
      );
    }
  };

  registry.register("chat.message", "keyword-detector", handler, 20, "global");
}
