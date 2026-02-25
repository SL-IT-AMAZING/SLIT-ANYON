/**
 * Delegate Task Retry Hook — Retries failed task delegations.
 *
 * After a tool execution, checks if a task delegation (sub-agent spawn)
 * failed. If so, suggests a retry or fallback to the primary agent.
 */
import log from "electron-log";

import type { HookHandler, HookRegistry } from "../hook_system";

const logger = log.scope("hook:delegate-task-retry");

/** Typed view of the input that may carry delegation info. */
interface DelegateInput {
  toolName?: string;
  toolError?: string;
  toolResult?: string;
}

/** Typed view of the output we may mutate. */
interface DelegateOutput {
  injectedMessages?: Array<{ role: string; content: string }>;
  delegationFailed?: boolean;
}

/** Patterns that indicate a delegation or sub-agent failure. */
const DELEGATION_FAILURE_PATTERNS = [
  "task failed",
  "agent failed",
  "delegation error",
  "sub-agent error",
  "subagent error",
  "spawn failed",
  "agent timed out",
  "agent timeout",
];

/** Check if the tool output indicates a delegation failure. */
function isDelegationFailure(input: unknown): boolean {
  const inp = input as DelegateInput;

  const toolName = inp.toolName?.toLowerCase() ?? "";
  const isTaskTool =
    toolName.includes("task") ||
    toolName.includes("delegate") ||
    toolName.includes("agent");

  if (!isTaskTool) return false;

  const errorText = (inp.toolError ?? "").toLowerCase();
  if (!errorText) return false;

  return DELEGATION_FAILURE_PATTERNS.some((p) => errorText.includes(p));
}

export function registerDelegateTaskRetryHook(registry: HookRegistry): void {
  const handler: HookHandler = async (input, output, ctx) => {
    if (!isDelegationFailure(input)) return;

    logger.log(
      `[${ctx.runId}] Task delegation failure detected — suggesting retry`,
    );

    const out = output as DelegateOutput;
    out.delegationFailed = true;

    if (!out.injectedMessages) {
      out.injectedMessages = [];
    }

    out.injectedMessages.push({
      role: "system",
      content:
        "[DELEGATION RETRY] A task delegation to a sub-agent failed. " +
        "Consider retrying with a different agent, simplifying the task " +
        "description, or completing the task directly yourself.",
    });
  };

  registry.register(
    "tool.execute.after",
    "delegate-task-retry",
    handler,
    70,
    "run",
  );
}
