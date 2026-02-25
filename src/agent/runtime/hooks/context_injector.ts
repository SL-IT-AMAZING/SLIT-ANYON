/**
 * Context Injector Hook — Injects ContextCollector content into messages.
 *
 * Reads the accumulated context injections from the ContextCollector
 * (populated by other hooks or runtime components) and appends them
 * to the message array before API calls.
 */
import log from "electron-log";

import type { HookHandler, HookRegistry } from "../hook_system";

const logger = log.scope("hook:context-injector");

/** Shape of a context injection entry. */
interface ContextInjectionEntry {
  key: string;
  content: string;
  priority?: number;
  source?: string;
}

/** Typed view of input that may carry a contextCollector. */
interface ContextInput {
  contextInjections?: ContextInjectionEntry[];
}

/** Typed view of the output we may mutate. */
interface MessagesOutput {
  injectedMessages?: Array<{ role: string; content: string }>;
}

export function registerContextInjectorHook(registry: HookRegistry): void {
  const handler: HookHandler = async (input, output, _ctx) => {
    const inp = input as ContextInput;
    const injections = inp.contextInjections;

    if (!injections || !Array.isArray(injections) || injections.length === 0) {
      return;
    }

    // Sort by priority (lower = first), defaulting to 100
    const sorted = [...injections].sort(
      (a, b) => (a.priority ?? 100) - (b.priority ?? 100),
    );

    const out = output as MessagesOutput;
    if (!out.injectedMessages) {
      out.injectedMessages = [];
    }

    for (const injection of sorted) {
      if (!injection.content?.trim()) continue;

      const tag = injection.source ?? injection.key;
      out.injectedMessages.push({
        role: "system",
        content: `<${tag}>\n${injection.content}\n</${tag}>`,
      });
    }

    logger.log(`Injected ${sorted.length} context injection(s)`);
  };

  registry.register(
    "messages.transform",
    "context-injector",
    handler,
    20,
    "global",
  );
}
