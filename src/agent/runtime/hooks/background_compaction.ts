/**
 * Background Compaction Hook — Preserves background task state during compaction.
 *
 * When context compaction happens, injected background task status messages
 * may be lost. This hook captures active background tasks before compaction
 * and re-injects their status afterward.
 */
import log from "electron-log";

import type { HookHandler, HookRegistry } from "../hook_system";

const logger = log.scope("hook:background-compaction");

interface BackgroundTaskInfo {
  taskId: string;
  description: string;
  status: "running" | "completed" | "failed";
  agentName?: string;
}

// Per-session snapshot of background tasks
const taskSnapshots = new Map<string, BackgroundTaskInfo[]>();

const beforeHandler: HookHandler = async (input, _output, ctx) => {
  // Capture current background tasks from input context
  const inp = input as { backgroundTasks?: BackgroundTaskInfo[] };

  if (inp.backgroundTasks && inp.backgroundTasks.length > 0) {
    taskSnapshots.set(ctx.sessionId, [...inp.backgroundTasks]);
    logger.log(
      `[${ctx.runId}] Saved ${inp.backgroundTasks.length} background tasks before compaction`,
    );
  }
};

const afterHandler: HookHandler = async (_input, output, ctx) => {
  const snapshot = taskSnapshots.get(ctx.sessionId);
  if (!snapshot || snapshot.length === 0) return;

  // Re-inject background task status as a system message
  const running = snapshot.filter((t) => t.status === "running");
  const completed = snapshot.filter((t) => t.status === "completed");

  if (running.length === 0 && completed.length === 0) {
    taskSnapshots.delete(ctx.sessionId);
    return;
  }

  const out = output as {
    injectedMessages?: Array<{ role: string; content: string }>;
  };
  if (!out.injectedMessages) out.injectedMessages = [];

  const parts: string[] = ["[BACKGROUND TASKS - Restored after compaction]"];

  if (running.length > 0) {
    parts.push(`\nRunning (${running.length}):`);
    for (const task of running) {
      parts.push(
        `  - ${task.taskId}: ${task.description} (${task.agentName ?? "unknown agent"})`,
      );
    }
  }

  if (completed.length > 0) {
    parts.push(`\nCompleted (${completed.length}):`);
    for (const task of completed) {
      parts.push(`  - ${task.taskId}: ${task.description}`);
    }
  }

  out.injectedMessages.push({
    role: "system",
    content: parts.join("\n"),
  });

  // Clean up
  taskSnapshots.delete(ctx.sessionId);

  logger.log(
    `[${ctx.runId}] Restored ${snapshot.length} background tasks after compaction`,
  );
};

export function registerBackgroundCompactionHook(registry: HookRegistry): void {
  registry.register(
    "compaction.before",
    "background-compaction:before",
    beforeHandler,
    40,
    "run",
  );
  registry.register(
    "compaction.after",
    "background-compaction:after",
    afterHandler,
    40,
    "run",
  );
}
