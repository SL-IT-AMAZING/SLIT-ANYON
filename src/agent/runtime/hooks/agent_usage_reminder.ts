/**
 * Agent Usage Reminder Hook — Reminds the primary agent to use subagents.
 *
 * If the primary agent uses low-level tools (grep, glob, read, etc.)
 * too frequently instead of delegating to specialized subagents, this
 * hook injects a gentle reminder to prefer delegation.
 */
import log from "electron-log";

import type { HookHandler, HookRegistry } from "../hook_system";

const logger = log.scope("hook:agent-usage-reminder");

/** Tools that should typically be delegated to subagents. */
const DELEGATABLE_TOOLS = new Set([
  "grep",
  "glob",
  "read",
  "bash",
  "find",
  "search",
]);

/** Number of direct tool uses before we inject a reminder. */
const DIRECT_USE_THRESHOLD = 5;

/** Typed view of the input from tool execution. */
interface UsageInput {
  toolName?: string;
}

/** Typed view of the output we may mutate. */
interface UsageOutput {
  injectedMessages?: Array<{ role: string; content: string }>;
  directToolUseCount?: number;
}

/**
 * Session-scoped counter for tracking direct tool usage.
 * Keyed by sessionId to avoid cross-session contamination.
 */
const directToolCounts = new Map<string, number>();

export function registerAgentUsageReminderHook(registry: HookRegistry): void {
  const handler: HookHandler = async (input, output, ctx) => {
    const inp = input as UsageInput;
    const toolName = inp.toolName?.toLowerCase();

    if (!toolName || !DELEGATABLE_TOOLS.has(toolName)) {
      return;
    }

    // Increment counter for this session
    const key = ctx.sessionId;
    const count = (directToolCounts.get(key) ?? 0) + 1;
    directToolCounts.set(key, count);

    const out = output as UsageOutput;
    out.directToolUseCount = count;

    // Only inject a reminder at the threshold and then every N uses
    if (
      count === DIRECT_USE_THRESHOLD ||
      count % (DIRECT_USE_THRESHOLD * 2) === 0
    ) {
      logger.log(
        `[${ctx.sessionId}] Agent has used delegatable tools ${count} times directly`,
      );

      if (!out.injectedMessages) {
        out.injectedMessages = [];
      }

      out.injectedMessages.push({
        role: "system",
        content:
          "[Agent Usage Reminder] You have used search/fetch tools directly " +
          "multiple times. Consider delegating to specialized subagents " +
          "(explore, librarian) for better results and parallel execution.",
      });
    }
  };

  registry.register(
    "tool.execute.after",
    "agent-usage-reminder",
    handler,
    30,
    "global",
  );
}
