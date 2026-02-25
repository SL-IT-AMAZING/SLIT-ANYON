/**
 * Empty Task Response Detector Hook — Detects empty sub-agent responses.
 *
 * After each agent step, checks if a sub-agent returned an empty or
 * nearly-empty response. Logs a warning and injects a notification
 * so the parent agent can decide whether to retry.
 */
import log from "electron-log";

import type { HookHandler, HookRegistry } from "../hook_system";

const logger = log.scope("hook:empty-task-response-detector");

/** Minimum meaningful response length (in characters). */
const MIN_RESPONSE_LENGTH = 10;

/** Typed view of the input that may carry task response info. */
interface TaskResponseInput {
  taskResult?: string;
  subagentResponse?: string;
  agentResponse?: string;
}

/** Typed view of the output we may mutate. */
interface TaskResponseOutput {
  injectedMessages?: Array<{ role: string; content: string }>;
  emptyResponseDetected?: boolean;
}

/** Check if a response string is effectively empty. */
function isEffectivelyEmpty(response: string | undefined): boolean {
  if (!response) return true;
  const trimmed = response.trim();
  return trimmed.length < MIN_RESPONSE_LENGTH;
}

export function registerEmptyTaskResponseDetectorHook(
  registry: HookRegistry,
): void {
  const handler: HookHandler = async (input, output, ctx) => {
    const inp = input as TaskResponseInput;

    // Check all possible response fields
    const response =
      inp.taskResult ?? inp.subagentResponse ?? inp.agentResponse;

    // Only flag if a response field exists but is empty
    // (no response field at all means this step didn't involve a sub-agent)
    if (response === undefined) return;

    if (!isEffectivelyEmpty(response)) return;

    logger.warn(
      `[${ctx.runId}] Empty or near-empty sub-agent response detected`,
    );

    const out = output as TaskResponseOutput;
    out.emptyResponseDetected = true;

    if (!out.injectedMessages) {
      out.injectedMessages = [];
    }

    out.injectedMessages.push({
      role: "system",
      content:
        "[EMPTY RESPONSE] A sub-agent returned an empty or near-empty " +
        "response. This may indicate the task was too vague, the agent " +
        "failed silently, or an error occurred. Consider retrying with " +
        "a more specific prompt or completing the task directly.",
    });
  };

  registry.register(
    "agent.step.after",
    "empty-task-response-detector",
    handler,
    45,
    "run",
  );
}
