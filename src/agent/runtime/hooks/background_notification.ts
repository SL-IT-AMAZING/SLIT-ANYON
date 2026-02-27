/**
 * Background Notification Hook — Notifies when background tasks complete.
 *
 * After each agent step, checks for recently completed background tasks
 * and injects a notification so the agent can process the results.
 */
import log from "electron-log";

import type { HookHandler, HookRegistry } from "../hook_system";

const logger = log.scope("hook:background-notification");

/** Shape of a background task status entry. */
interface BackgroundTaskInfo {
  taskId: string;
  status: string;
  agentName?: string;
  description?: string;
  result?: string;
  error?: string;
}

/** Typed view of the input that may carry background task info. */
interface NotificationInput {
  backgroundTasks?: BackgroundTaskInfo[];
  completedBackgroundTasks?: BackgroundTaskInfo[];
}

/** Typed view of the output we may mutate. */
interface NotificationOutput {
  injectedMessages?: Array<{ role: string; content: string }>;
  processedBackgroundTasks?: string[];
}

/** Track which tasks we've already notified about. */
const notifiedTasks = new Set<string>();

export function registerBackgroundNotificationHook(
  registry: HookRegistry,
): void {
  const handler: HookHandler = async (input, output, ctx) => {
    const inp = input as NotificationInput;

    // Check for completed tasks from either field
    const completedTasks = (
      inp.completedBackgroundTasks ??
      (inp.backgroundTasks ?? []).filter(
        (t) => t.status === "completed" || t.status === "error",
      )
    ).filter((t) => !notifiedTasks.has(t.taskId));

    if (completedTasks.length === 0) return;

    const out = output as NotificationOutput;
    if (!out.injectedMessages) {
      out.injectedMessages = [];
    }
    if (!out.processedBackgroundTasks) {
      out.processedBackgroundTasks = [];
    }

    for (const task of completedTasks) {
      notifiedTasks.add(task.taskId);
      out.processedBackgroundTasks.push(task.taskId);

      const statusLabel = task.status === "error" ? "FAILED" : "COMPLETED";
      const detail = task.error ?? task.result ?? "(no details)";
      const agent = task.agentName ?? "unknown";
      const desc = task.description ?? task.taskId;

      out.injectedMessages.push({
        role: "system",
        content:
          `[Background Task ${statusLabel}] Agent "${agent}" — ${desc}\n` +
          `Result: ${detail}`,
      });
    }

    logger.log(
      `[${ctx.sessionId}] Notified about ${completedTasks.length} background task(s)`,
    );
  };

  registry.register(
    "agent.step.after",
    "background-notification",
    handler,
    60,
    "session",
  );
}
