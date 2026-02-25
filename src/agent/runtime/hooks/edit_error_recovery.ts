/**
 * Edit Error Recovery Hook — Retries edit operations on LINE#ID mismatch.
 *
 * After a tool execution, checks if the edit tool produced a LINE#ID
 * mismatch error. If so, injects a retry hint suggesting the agent
 * re-read the file and retry with fresh LINE#ID tags.
 */
import log from "electron-log";

import type { HookHandler, HookRegistry } from "../hook_system";

const logger = log.scope("hook:edit-error-recovery");

/** Typed view of the input that may carry tool result info. */
interface EditToolInput {
  toolName?: string;
  toolResult?: string;
  toolError?: string;
}

/** Typed view of the output we may mutate. */
interface EditToolOutput {
  injectedMessages?: Array<{ role: string; content: string }>;
  retryHint?: string;
}

/** Patterns that indicate a LINE#ID mismatch in edit tool output. */
const MISMATCH_PATTERNS = [
  "mismatch",
  "LINE#ID",
  "line#id",
  "stale tag",
  "tag mismatch",
  "hash mismatch",
];

/** Check if the tool output indicates an edit mismatch error. */
function isEditMismatch(input: unknown): boolean {
  const inp = input as EditToolInput;

  // Only check edit-related tools
  const toolName = inp.toolName?.toLowerCase() ?? "";
  if (!toolName.includes("edit") && !toolName.includes("write")) {
    return false;
  }

  const errorText = (inp.toolError ?? inp.toolResult ?? "").toLowerCase();
  return MISMATCH_PATTERNS.some((p) => errorText.includes(p));
}

export function registerEditErrorRecoveryHook(registry: HookRegistry): void {
  const handler: HookHandler = async (input, output, ctx) => {
    if (!isEditMismatch(input)) return;

    logger.log(
      `[${ctx.runId}] Edit LINE#ID mismatch detected — injecting retry hint`,
    );

    const out = output as EditToolOutput;
    out.retryHint = "re-read-file";

    if (!out.injectedMessages) {
      out.injectedMessages = [];
    }

    out.injectedMessages.push({
      role: "system",
      content:
        "[EDIT RECOVERY] A LINE#ID mismatch was detected. The file may have " +
        "changed since you last read it. Re-read the file to get fresh " +
        "LINE#ID tags, then retry the edit with the updated tags.",
    });
  };

  registry.register(
    "tool.execute.after",
    "edit-error-recovery",
    handler,
    80,
    "run",
  );
}
