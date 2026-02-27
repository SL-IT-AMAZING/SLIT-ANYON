/**
 * Compaction Context Injector Hook — Injects context during compaction.
 *
 * When context window compaction occurs, injects a summarization
 * instruction to help the model maintain task coherence despite
 * message pruning.
 */
import log from "electron-log";

import type { HookHandler, HookRegistry } from "../hook_system";

const logger = log.scope("hook:compaction-context-injector");

const handler: HookHandler = async (_input, output, ctx) => {
  const out = output as {
    injectedMessages?: Array<{ role: string; content: string }>;
  };
  if (!out.injectedMessages) out.injectedMessages = [];

  out.injectedMessages.push({
    role: "system",
    content:
      "[CONTEXT COMPACTION] Earlier messages have been summarized to fit within the context window. " +
      "Key points from the conversation so far:\n" +
      "- Your todo list (if any) is the source of truth for remaining work\n" +
      "- Check git status and recent changes to understand what's been done\n" +
      "- If you were in the middle of a task, continue from where you left off\n" +
      "- Do NOT restart tasks that were already completed",
  });

  logger.log(
    `[${ctx.runId}] Injected compaction context for session ${ctx.sessionId}`,
  );
};

export function registerCompactionContextInjectorHook(
  registry: HookRegistry,
): void {
  registry.register(
    "compaction.after",
    "compaction-context-injector",
    handler,
    60,
    "global",
  );
}
