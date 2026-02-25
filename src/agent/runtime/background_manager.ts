import { randomUUID } from "node:crypto";
/**
 * Background Manager — manages sub-agent task lifecycle and concurrency.
 *
 * Spawns child runtimes, tracks their state/output, cascades parent abort,
 * and prunes stale tasks to keep runtime memory bounded.
 */
import log from "electron-log";

import { AgentRuntime, type AgentRuntimeParams } from "./agent_runtime";
import {
  type ConcurrencyConfig,
  ConcurrencyManager,
} from "./concurrency_manager";
import { type RunContext, createSubAgentRunContext } from "./run_context";

const logger = log.scope("background-manager");

export type TaskStatus =
  | "pending"
  | "running"
  | "completed"
  | "error"
  | "cancelled"
  | "stale";

export interface BackgroundTask {
  id: string;
  agentName: string;
  description: string;
  status: TaskStatus;
  runtime: AgentRuntime | null;
  abort: AbortController;
  sessionId: string;
  startedAt: number;
  completedAt?: number;
  result?: string;
  error?: string;
}

export interface SpawnParams {
  agentName: string;
  prompt: string;
  description: string;
  parentRunContext: RunContext;
  parentAbort: AbortSignal;
  runtimeFactory: (
    runContext: RunContext,
    abort: AbortController,
  ) => AgentRuntimeParams;
  runInBackground: boolean;
}

export interface TaskOutput {
  taskId: string;
  status: TaskStatus;
  result?: string;
  error?: string;
  agentName: string;
  description: string;
  duration?: number;
}

export class BackgroundManager {
  private tasks = new Map<string, BackgroundTask>();
  private concurrency: ConcurrencyManager;
  private staleTimeout: number;
  private pruneInterval: ReturnType<typeof setInterval> | null = null;

  constructor(config: ConcurrencyConfig & { staleTimeoutMs?: number }) {
    this.concurrency = new ConcurrencyManager(config);
    this.staleTimeout = config.staleTimeoutMs ?? 180_000;
    this.pruneInterval = setInterval(() => this.pruneStale(), 60_000);
  }

  async spawnAgent(params: SpawnParams): Promise<string> {
    const taskId = randomUUID();
    const childRunContext = createSubAgentRunContext({
      parentRunId: params.parentRunContext.runId,
      rootChatId: params.parentRunContext.rootChatId,
      chatId: params.parentRunContext.chatId,
      agentName: params.agentName,
    });

    const childAbort = new AbortController();
    const onParentAbort = () => {
      childAbort.abort();
    };
    params.parentAbort.addEventListener("abort", onParentAbort, { once: true });

    if (params.parentAbort.aborted) {
      childAbort.abort();
    }

    const task: BackgroundTask = {
      id: taskId,
      agentName: params.agentName,
      description: params.description,
      status: "pending",
      runtime: null,
      abort: childAbort,
      sessionId: childRunContext.runId,
      startedAt: Date.now(),
    };
    this.tasks.set(taskId, task);

    const concurrencyKey = this.getConcurrencyKey(params);

    const runTask = async (): Promise<void> => {
      let acquired = false;
      try {
        await this.concurrency.acquire(concurrencyKey);
        acquired = true;

        if (childAbort.signal.aborted) {
          task.status = "cancelled";
          task.error = "Task aborted before runtime start";
          return;
        }

        task.status = "running";
        const runtimeParams = params.runtimeFactory(
          childRunContext,
          childAbort,
        );
        const runtime = new AgentRuntime(runtimeParams);
        task.runtime = runtime;

        const result = await runtime.loop();
        task.status = result === "aborted" ? "cancelled" : "completed";
        task.result = runtime.getAccumulatedResponseText();
      } catch (err) {
        task.status = childAbort.signal.aborted ? "cancelled" : "error";
        task.error = err instanceof Error ? err.message : String(err);
        logger.error(`Task ${taskId} failed:`, task.error);
      } finally {
        task.completedAt = Date.now();
        params.parentAbort.removeEventListener("abort", onParentAbort);
        task.runtime = null;
        if (acquired) {
          this.concurrency.release(concurrencyKey);
        }
      }
    };

    if (params.runInBackground) {
      runTask().catch((err) => {
        logger.error(
          `Unhandled background task error for ${taskId}:`,
          err instanceof Error ? err.message : String(err),
        );
      });
      return taskId;
    }

    await runTask();
    return taskId;
  }

  getTaskStatus(taskId: string): TaskStatus | undefined {
    return this.tasks.get(taskId)?.status;
  }

  getTaskOutput(taskId: string): TaskOutput | undefined {
    const task = this.tasks.get(taskId);
    if (!task) {
      return undefined;
    }

    const end = task.completedAt ?? Date.now();
    return {
      taskId: task.id,
      status: task.status,
      result: task.result,
      error: task.error,
      agentName: task.agentName,
      description: task.description,
      duration: Math.max(0, end - task.startedAt),
    };
  }

  getAllTasks(): BackgroundTask[] {
    return [...this.tasks.values()];
  }

  cancelTask(taskId: string): void {
    const task = this.tasks.get(taskId);
    if (!task) {
      return;
    }

    if (task.status === "completed" || task.status === "error") {
      return;
    }

    task.abort.abort();
    task.runtime?.abort();
    task.runtime = null;
    task.status = "cancelled";
    task.completedAt = Date.now();
    task.error = task.error ?? "Task cancelled";
  }

  cancelAll(): void {
    for (const taskId of this.tasks.keys()) {
      this.cancelTask(taskId);
    }
  }

  pruneStale(): void {
    const cutoff = Date.now() - this.staleTimeout;

    for (const task of this.tasks.values()) {
      if (task.status === "stale") {
        continue;
      }

      const ageAnchor = task.completedAt ?? task.startedAt;
      if (ageAnchor >= cutoff) {
        continue;
      }

      if (task.status === "pending" || task.status === "running") {
        task.abort.abort();
        task.runtime?.abort();
      }

      task.runtime = null;
      task.status = "stale";
      task.completedAt = task.completedAt ?? Date.now();
      task.error = task.error ?? "Task marked stale by timeout";
    }
  }

  destroy(): void {
    this.cancelAll();

    if (this.pruneInterval) {
      clearInterval(this.pruneInterval);
      this.pruneInterval = null;
    }

    this.concurrency.destroy();
    this.tasks.clear();
  }

  private getConcurrencyKey(params: SpawnParams): string {
    return params.agentName.toLowerCase();
  }
}
