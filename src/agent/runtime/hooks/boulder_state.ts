/**
 * Boulder State Hook — Manages Sisyphus boulder state (todo count tracking).
 *
 * After each agent step, tracks the number of completed vs. pending
 * todos, computes a "boulder position" metric, and optionally injects
 * progress information to keep the agent motivated.
 */
import log from "electron-log";

import type { HookHandler, HookRegistry } from "../hook_system";

const logger = log.scope("hook:boulder-state");

/** Shape of a todo entry. */
interface TodoEntry {
  content: string;
  status: string;
  priority?: string;
}

/** Boulder state tracking per run. */
interface BoulderProgress {
  total: number;
  completed: number;
  pending: number;
  inProgress: number;
  cancelled: number;
  progressPercent: number;
}

/** Typed view of the input that may carry todo info. */
interface BoulderInput {
  todos?: TodoEntry[];
}

/** Typed view of the output we may mutate. */
interface BoulderOutput {
  boulderState?: BoulderProgress;
  injectedMessages?: Array<{ role: string; content: string }>;
}

/** Compute boulder progress from a list of todos. */
function computeProgress(todos: TodoEntry[]): BoulderProgress {
  const completed = todos.filter((t) => t.status === "completed").length;
  const pending = todos.filter((t) => t.status === "pending").length;
  const inProgress = todos.filter((t) => t.status === "in_progress").length;
  const cancelled = todos.filter((t) => t.status === "cancelled").length;
  const total = todos.length;

  // Progress is based on completed + cancelled vs total
  const done = completed + cancelled;
  const progressPercent = total > 0 ? Math.round((done / total) * 100) : 0;

  return { total, completed, pending, inProgress, cancelled, progressPercent };
}

export function registerBoulderStateHook(registry: HookRegistry): void {
  const handler: HookHandler = async (input, output, ctx) => {
    const inp = input as BoulderInput;
    const todos = inp.todos;

    if (!todos || !Array.isArray(todos) || todos.length === 0) {
      return;
    }

    const progress = computeProgress(todos);
    const out = output as BoulderOutput;
    out.boulderState = progress;

    logger.log(
      `[${ctx.runId}] Boulder state: ${progress.progressPercent}% ` +
        `(${progress.completed}/${progress.total} done, ` +
        `${progress.pending} pending, ${progress.inProgress} in-progress)`,
    );

    // Inject motivational message at milestone percentages
    if (
      progress.progressPercent > 0 &&
      progress.progressPercent < 100 &&
      progress.progressPercent % 25 === 0
    ) {
      if (!out.injectedMessages) {
        out.injectedMessages = [];
      }

      out.injectedMessages.push({
        role: "system",
        content:
          `[BOULDER PROGRESS] ${progress.progressPercent}% complete — ` +
          `${progress.completed} of ${progress.total} tasks done. ` +
          `${progress.pending + progress.inProgress} remaining. Keep pushing!`,
      });
    }
  };

  registry.register("agent.step.after", "boulder-state", handler, 95, "run");
}
