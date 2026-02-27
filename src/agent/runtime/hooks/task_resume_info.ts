/**
 * Task Resume Info Hook — Injects task resume context when resuming a session.
 *
 * Before an agent step, checks if this is a resumed session and, if so,
 * injects previous context (last task state, pending todos, etc.) to
 * help the agent pick up where it left off.
 */
import log from "electron-log";

import type { HookHandler, HookRegistry } from "../hook_system";

const logger = log.scope("hook:task-resume-info");

/** Typed view of the input that may carry resume info. */
interface ResumeInput {
  isResumedSession?: boolean;
  previousContext?: {
    lastAgent?: string;
    lastAction?: string;
    pendingTodos?: Array<{ content: string; status: string }>;
    handoffNote?: string;
  };
}

/** Typed view of the output we may mutate. */
interface ResumeOutput {
  injectedMessages?: Array<{ role: string; content: string }>;
  isResumedSession?: boolean;
}

export function registerTaskResumeInfoHook(registry: HookRegistry): void {
  const handler: HookHandler = async (input, output, ctx) => {
    const inp = input as ResumeInput;

    if (!inp.isResumedSession) return;

    const prevCtx = inp.previousContext;
    if (!prevCtx) return;

    logger.log(`[${ctx.runId}] Resuming session — injecting prior context`);

    const out = output as ResumeOutput;
    out.isResumedSession = true;

    if (!out.injectedMessages) {
      out.injectedMessages = [];
    }

    const parts: string[] = [
      "[SESSION RESUMED] You are continuing a previous work session.",
    ];

    if (prevCtx.lastAgent) {
      parts.push(`Last active agent: ${prevCtx.lastAgent}`);
    }

    if (prevCtx.lastAction) {
      parts.push(`Last action: ${prevCtx.lastAction}`);
    }

    if (prevCtx.handoffNote) {
      parts.push(`Handoff note: ${prevCtx.handoffNote}`);
    }

    if (prevCtx.pendingTodos && prevCtx.pendingTodos.length > 0) {
      parts.push("Pending todos from previous session:");
      for (const todo of prevCtx.pendingTodos) {
        parts.push(`  - [${todo.status}] ${todo.content}`);
      }
    }

    out.injectedMessages.push({
      role: "system",
      content: parts.join("\n"),
    });
  };

  registry.register(
    "agent.step.before",
    "task-resume-info",
    handler,
    40,
    "run",
  );
}
