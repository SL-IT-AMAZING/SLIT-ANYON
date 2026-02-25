/**
 * Ralph Loop Hook — Forces agent to continue when todos are incomplete.
 *
 * When the ralph-loop feature is active, this hook checks for incomplete
 * todo items after each agent step. If any remain, it injects a
 * continuation reminder into the output so the agent keeps working.
 */
import log from "electron-log";

import type { HookHandler, HookRegistry } from "../hook_system";

const logger = log.scope("hook:ralph-loop");

/** Shape of a todo item found in hook input/output. */
interface TodoEntry {
  content: string;
  status: string;
  priority?: string;
}

/** Typed view of the output object we may mutate. */
interface RalphLoopOutput {
  injectedMessages?: Array<{ role: string; content: string }>;
  ralphLoopActive?: boolean;
  todos?: TodoEntry[];
}

/**
 * Check whether the ralph-loop feature is active for this run.
 * It's considered active when the input signals it or when
 * the output already carries the `ralphLoopActive` flag.
 */
function isRalphLoopActive(input: unknown, output: unknown): boolean {
  const inp = input as Record<string, unknown> | null;
  const out = output as Record<string, unknown> | null;

  return (
    inp?.["ralphLoopActive"] === true ||
    out?.["ralphLoopActive"] === true ||
    inp?.["ralph-loop"] === true
  );
}

/** Extract incomplete (pending / in_progress) todos from input or output. */
function getIncompleteTodos(input: unknown, output: unknown): TodoEntry[] {
  const sources = [input, output];
  for (const src of sources) {
    const obj = src as Record<string, unknown> | null;
    const todos = obj?.["todos"];
    if (Array.isArray(todos)) {
      return (todos as TodoEntry[]).filter(
        (t) => t.status === "pending" || t.status === "in_progress",
      );
    }
  }
  return [];
}

const CONTINUATION_MESSAGE =
  "[SYSTEM REMINDER - RALPH LOOP] You are in ralph-loop mode. " +
  "Incomplete tasks remain in your todo list. Continue working on the next " +
  "pending task. Proceed without asking for permission. Mark each task " +
  "complete when finished. Do not stop until all tasks are done.";

export function registerRalphLoopHook(registry: HookRegistry): void {
  const handler: HookHandler = async (input, output, ctx) => {
    if (!isRalphLoopActive(input, output)) {
      return;
    }

    const incomplete = getIncompleteTodos(input, output);
    if (incomplete.length === 0) {
      logger.log(
        `[${ctx.runId}] Ralph loop: all todos complete — no injection needed`,
      );
      return;
    }

    logger.log(
      `[${ctx.runId}] Ralph loop: ${incomplete.length} incomplete todo(s) — injecting continuation`,
    );

    const out = output as RalphLoopOutput;
    if (!out.injectedMessages) {
      out.injectedMessages = [];
    }

    out.injectedMessages.push({
      role: "system",
      content: CONTINUATION_MESSAGE,
    });
  };

  registry.register("agent.step.after", "ralph-loop", handler, 100, "run");
}
