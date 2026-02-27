/**
 * Start Work Hook — Initializes work session from a Prometheus plan.
 *
 * Detects "start work" or "/start-work" commands in chat messages
 * and signals the runtime to load and execute a Prometheus plan
 * from the `.sisyphus/plans/` directory.
 */
import fs from "node:fs";
import path from "node:path";

import log from "electron-log";

import type { HookHandler, HookRegistry } from "../hook_system";

const logger = log.scope("hook:start-work");

/** Typed view of the input from a chat message. */
interface StartWorkInput {
  message?: string;
  content?: string;
}

/** Typed view of the output we may mutate. */
interface StartWorkOutput {
  startWorkDetected?: boolean;
  planPath?: string;
  planContent?: string;
  injectedMessages?: Array<{ role: string; content: string }>;
}

/** Patterns that trigger start-work behavior. */
const START_WORK_PATTERNS = [
  /^\/start[- ]?work\b/i,
  /^start\s+work\b/i,
  /^begin\s+work\b/i,
  /^execute\s+(?:the\s+)?plan\b/i,
];

/** Check if a message triggers start-work. */
function isStartWorkCommand(message: string): boolean {
  return START_WORK_PATTERNS.some((p) => p.test(message.trim()));
}

/** Find the most recent plan file in the plans directory. */
function findLatestPlan(projectDir: string): string | null {
  const plansDir = path.join(projectDir, ".sisyphus", "plans");

  try {
    const files = fs.readdirSync(plansDir).filter((f) => f.endsWith(".md"));
    if (files.length === 0) return null;

    // Sort by modification time, most recent first
    const sorted = files
      .map((f) => ({
        name: f,
        mtime: fs.statSync(path.join(plansDir, f)).mtimeMs,
      }))
      .sort((a, b) => b.mtime - a.mtime);

    return path.join(plansDir, sorted[0].name);
  } catch {
    return null;
  }
}

export function registerStartWorkHook(registry: HookRegistry): void {
  const handler: HookHandler = async (input, output, ctx) => {
    const inp = input as StartWorkInput;
    const text = inp.message ?? inp.content;

    if (typeof text !== "string") return;
    if (!isStartWorkCommand(text)) return;

    logger.log(`[${ctx.sessionId}] Start-work command detected`);

    const out = output as StartWorkOutput;
    out.startWorkDetected = true;

    // Try to find and load the latest plan
    const planPath = findLatestPlan(ctx.directory);
    if (planPath) {
      try {
        const content = fs.readFileSync(planPath, "utf-8");
        out.planPath = planPath;
        out.planContent = content;

        logger.log(`[${ctx.sessionId}] Loaded plan from ${planPath}`);
      } catch {
        logger.warn(`[${ctx.sessionId}] Failed to read plan at ${planPath}`);
      }
    }

    if (!out.injectedMessages) {
      out.injectedMessages = [];
    }

    out.injectedMessages.push({
      role: "system",
      content: out.planContent
        ? `[START WORK] Executing plan from ${out.planPath}.\n\n${out.planContent}`
        : "[START WORK] No plan found in .sisyphus/plans/. Starting fresh work session.",
    });
  };

  registry.register("chat.message", "start-work", handler, 30, "session");
}
