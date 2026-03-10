import type { PluginInput } from "@opencode-ai/plugin";
import { createTaskmasterEventHandler } from "./event-handler";
import { createToolExecuteAfterHandler } from "./tool-execute-after";
import { createToolExecuteBeforeHandler } from "./tool-execute-before";
import type { SessionState, TaskmasterHookOptions } from "./types";

export function createTaskmasterHook(
  ctx: PluginInput,
  options?: TaskmasterHookOptions,
) {
  const sessions = new Map<string, SessionState>();
  const pendingFilePaths = new Map<string, string>();
  const autoCommit = options?.autoCommit ?? true;

  function getState(sessionID: string): SessionState {
    let state = sessions.get(sessionID);
    if (!state) {
      state = { promptFailureCount: 0 };
      sessions.set(sessionID, state);
    }
    return state;
  }

  return {
    handler: createTaskmasterEventHandler({ ctx, options, sessions, getState }),
    "tool.execute.before": createToolExecuteBeforeHandler({
      ctx,
      pendingFilePaths,
    }),
    "tool.execute.after": createToolExecuteAfterHandler({
      ctx,
      pendingFilePaths,
      autoCommit,
    }),
  };
}
