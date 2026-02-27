import { and, desc, eq } from "drizzle-orm";
import log from "electron-log";

import { db } from "@/db";
import { agentRuns } from "@/db/schema";

const logger = log.scope("run-tracker");

export interface RunInfo {
  runId: string;
  chatId: number;
  parentRunId: string | null;
  agentName: string;
  agentKind: string;
  status: string;
}

/**
 * Find the most recent run for a chat.
 */
export async function findCurrentRun(chatId: number): Promise<RunInfo | null> {
  try {
    const result = await db.query.agentRuns.findFirst({
      where: and(eq(agentRuns.chatId, chatId), eq(agentRuns.status, "running")),
      orderBy: [desc(agentRuns.startedAt)],
    });
    return result
      ? {
          runId: result.runId,
          chatId: result.chatId,
          parentRunId: result.parentRunId,
          agentName: result.agentName,
          agentKind: result.agentKind,
          status: result.status,
        }
      : null;
  } catch (err) {
    logger.error("findCurrentRun failed:", err);
    return null;
  }
}

/**
 * Check if the current run is an orchestrator (top-level, no parent).
 */
export async function isOrchestratorRun(runId: string): Promise<boolean> {
  try {
    const run = await db.query.agentRuns.findFirst({
      where: eq(agentRuns.runId, runId),
    });
    return run ? run.parentRunId === null : false;
  } catch (err) {
    logger.error("isOrchestratorRun failed:", err);
    return false;
  }
}

/**
 * Get the full run chain (walk up parentRunId links).
 * Returns [current, parent, grandparent, ...root].
 */
export async function getRunChain(runId: string): Promise<RunInfo[]> {
  const chain: RunInfo[] = [];
  let currentId: string | null = runId;
  const maxDepth = 20; // Safety: prevent infinite loops
  let depth = 0;

  try {
    while (currentId && depth < maxDepth) {
      const run = await db.query.agentRuns.findFirst({
        where: eq(agentRuns.runId, currentId),
      });
      if (!run) break;

      chain.push({
        runId: run.runId,
        chatId: run.chatId,
        parentRunId: run.parentRunId,
        agentName: run.agentName,
        agentKind: run.agentKind,
        status: run.status,
      });

      currentId = run.parentRunId;
      depth++;
    }
  } catch (err) {
    logger.error("getRunChain failed:", err);
  }

  return chain;
}

/**
 * Find the most recent run by a specific agent for a chat.
 */
export async function findLastRunByAgent(
  chatId: number,
  agentName: string,
): Promise<RunInfo | null> {
  try {
    const result = await db.query.agentRuns.findFirst({
      where: and(
        eq(agentRuns.chatId, chatId),
        eq(agentRuns.agentName, agentName),
      ),
      orderBy: [desc(agentRuns.startedAt)],
    });
    return result
      ? {
          runId: result.runId,
          chatId: result.chatId,
          parentRunId: result.parentRunId,
          agentName: result.agentName,
          agentKind: result.agentKind,
          status: result.status,
        }
      : null;
  } catch (err) {
    logger.error("findLastRunByAgent failed:", err);
    return null;
  }
}

/**
 * Find all child runs (direct sub-agents) of a parent run.
 */
export async function findChildRuns(parentRunId: string): Promise<RunInfo[]> {
  try {
    const results = await db.query.agentRuns.findMany({
      where: eq(agentRuns.parentRunId, parentRunId),
      orderBy: [desc(agentRuns.startedAt)],
    });
    return results.map((r) => ({
      runId: r.runId,
      chatId: r.chatId,
      parentRunId: r.parentRunId,
      agentName: r.agentName,
      agentKind: r.agentKind,
      status: r.status,
    }));
  } catch (err) {
    logger.error("findChildRuns failed:", err);
    return [];
  }
}

/**
 * Update the status of a run.
 */
export async function updateRunStatus(
  runId: string,
  status: "running" | "completed" | "error" | "cancelled",
  abortReason?: string,
): Promise<void> {
  try {
    await db
      .update(agentRuns)
      .set({
        status,
        endedAt: status !== "running" ? new Date() : undefined,
        abortReason: abortReason ?? null,
      })
      .where(eq(agentRuns.runId, runId));
  } catch (err) {
    logger.error("updateRunStatus failed:", err);
  }
}
