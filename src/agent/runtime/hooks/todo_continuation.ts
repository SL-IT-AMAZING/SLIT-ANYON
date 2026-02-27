/**
 * Todo Continuation Hook — Detects incomplete todos and injects a reminder.
 *
 * After each agent step, inspects the output for TodoWrite results.
 * If incomplete items remain, injects a system-level continuation nudge
 * so the agent doesn't accidentally stop working.
 */
import log from "electron-log";

import type { HookHandler, HookRegistry } from "../hook_system";

const logger = log.scope("hook:todo-continuation");

/** Shape of a todo item. */
interface TodoEntry {
  content: string;
  status: string;
  priority?: string;
}

/** Typed view of the output object we may mutate. */
interface ContinuationOutput {
  injectedMessages?: Array<{ role: string; content: string }>;
  todos?: TodoEntry[];
  todoWriteDetected?: boolean;
}

const REMINDER_MESSAGE =
  "[SYSTEM REMINDER - TODO CONTINUATION] Incomplete tasks remain in your " +
  "todo list. Continue working on the next pending task. Proceed without " +
  "asking for permission. Mark each task complete when finished. Do not " +
  "stop until all tasks are done.";

/** Extract todos from both input and output. */
function extractTodos(input: unknown, output: unknown): TodoEntry[] {
  for (const src of [output, input]) {
    const obj = src as Record<string, unknown> | null;
    const todos = obj?.["todos"];
    if (Array.isArray(todos)) {
      return todos as TodoEntry[];
    }
  }
  return [];
}

/** Check if a TodoWrite tool call was detected in this step. */
function hasTodoWriteCall(input: unknown, output: unknown): boolean {
  for (const src of [input, output]) {
    const obj = src as Record<string, unknown> | null;
    if (obj?.["todoWriteDetected"] === true) return true;

    const toolName = obj?.["toolName"];
    if (
      typeof toolName === "string" &&
      toolName.toLowerCase().includes("todo")
    ) {
      return true;
    }
  }
  return false;
}

export function registerTodoContinuationHook(registry: HookRegistry): void {
  const handler: HookHandler = async (input, output, ctx) => {
    const todos = extractTodos(input, output);

    // Only act if we have todo data
    if (todos.length === 0 && !hasTodoWriteCall(input, output)) {
      return;
    }

    const incomplete = todos.filter(
      (t) => t.status === "pending" || t.status === "in_progress",
    );

    if (incomplete.length === 0) {
      return;
    }

    logger.log(
      `[${ctx.runId}] Todo continuation: ${incomplete.length} incomplete of ${todos.length} total`,
    );

    const out = output as ContinuationOutput;
    if (!out.injectedMessages) {
      out.injectedMessages = [];
    }

    out.injectedMessages.push({
      role: "system",
      content: REMINDER_MESSAGE,
    });
  };

  registry.register(
    "agent.step.after",
    "todo-continuation",
    handler,
    90,
    "run",
  );
}
