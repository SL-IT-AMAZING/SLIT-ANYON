import type { PluginContext } from "./types";

import { getMainSessionID } from "../features/claude-code-session-state";
import { clearThesisState } from "../features/thesis-state";
import { parsePersistLoopArguments } from "../hooks/persist-loop/command-arguments";
import { log } from "../shared";
import { resolveSessionAgent } from "./session-agent-resolver";

import type { CreatedHooks } from "../create-hooks";

export function createToolExecuteBeforeHandler(args: {
  ctx: PluginContext;
  hooks: CreatedHooks;
}): (
  input: { tool: string; sessionID: string; callID: string },
  output: { args: Record<string, unknown> },
) => Promise<void> {
  const { ctx, hooks } = args;

  return async (input, output): Promise<void> => {
    await hooks.writeExistingFileGuard?.["tool.execute.before"]?.(
      input,
      output,
    );
    await hooks.questionLabelTruncator?.["tool.execute.before"]?.(
      input,
      output,
    );
    await hooks.claudeCodeHooks?.["tool.execute.before"]?.(input, output);
    await hooks.nonInteractiveEnv?.["tool.execute.before"]?.(input, output);
    await hooks.commentChecker?.["tool.execute.before"]?.(input, output);
    await hooks.directoryAgentsInjector?.["tool.execute.before"]?.(
      input,
      output,
    );
    await hooks.directoryReadmeInjector?.["tool.execute.before"]?.(
      input,
      output,
    );
    await hooks.rulesInjector?.["tool.execute.before"]?.(input, output);
    await hooks.tasksTodowriteDisabler?.["tool.execute.before"]?.(
      input,
      output,
    );
    await hooks.strategistMdOnly?.["tool.execute.before"]?.(input, output);
    await hooks.workerNotepad?.["tool.execute.before"]?.(input, output);
    await hooks.taskmasterHook?.["tool.execute.before"]?.(input, output);

    const normalizedToolName = input.tool.toLowerCase();
    if (
      normalizedToolName === "question" ||
      normalizedToolName === "ask_user_question" ||
      normalizedToolName === "askuserquestion"
    ) {
      const sessionID = input.sessionID || getMainSessionID();
      await hooks.sessionNotification?.({
        event: {
          type: "tool.execute.before",
          properties: {
            sessionID,
            tool: input.tool,
            args: output.args,
          },
        },
      });
    }

    if (input.tool === "task") {
      const argsObject = output.args;
      const category =
        typeof argsObject.category === "string"
          ? argsObject.category
          : undefined;
      const subagentType =
        typeof argsObject.subagent_type === "string"
          ? argsObject.subagent_type
          : undefined;
      const sessionId =
        typeof argsObject.session_id === "string"
          ? argsObject.session_id
          : undefined;

      if (category) {
        argsObject.subagent_type = "worker";
      } else if (!subagentType && sessionId) {
        const resolvedAgent = await resolveSessionAgent(ctx.client, sessionId);
        argsObject.subagent_type = resolvedAgent ?? "continue";
      }
    }

    if (hooks.persistLoop && input.tool === "skill") {
      const rawName =
        typeof output.args.name === "string" ? output.args.name : undefined;
      const command = rawName?.replace(/^\//, "").toLowerCase();
      const sessionID = input.sessionID || getMainSessionID();

      if (command === "persist-loop" && sessionID) {
        const rawArgs = rawName?.replace(/^\/?(persist-loop)\s*/i, "") || "";
        const parsedArguments = parsePersistLoopArguments(rawArgs);

        hooks.persistLoop.startLoop(sessionID, parsedArguments.prompt, {
          maxIterations: parsedArguments.maxIterations,
          completionPromise: parsedArguments.completionPromise,
          strategy: parsedArguments.strategy,
        });
      } else if (command === "cancel-persist" && sessionID) {
        hooks.persistLoop.cancelLoop(sessionID);
      } else if (command === "anyon-loop" && sessionID) {
        const rawArgs = rawName?.replace(/^\/?(anyon-loop)\s*/i, "") || "";
        const parsedArguments = parsePersistLoopArguments(rawArgs);

        hooks.persistLoop.startLoop(sessionID, parsedArguments.prompt, {
          turbo: true,
          maxIterations: parsedArguments.maxIterations,
          completionPromise: parsedArguments.completionPromise,
          strategy: parsedArguments.strategy,
        });
      }
    }

    if (input.tool === "skill") {
      const rawName =
        typeof output.args.name === "string" ? output.args.name : undefined;
      const command = rawName?.replace(/^\//, "").toLowerCase();
      const sessionID = input.sessionID || getMainSessionID();

      if (command === "stop-continuation" && sessionID) {
        hooks.stopContinuationGuard?.stop(sessionID);
        hooks.todoContinuationEnforcer?.cancelAllCountdowns();
        hooks.persistLoop?.cancelLoop(sessionID);
        clearThesisState(ctx.directory);
        log("[stop-continuation] All continuation mechanisms stopped", {
          sessionID,
        });
      }
    }
  };
}
