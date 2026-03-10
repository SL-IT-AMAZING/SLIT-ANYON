import type { PluginInput } from "@opencode-ai/plugin";
import { isGptModel } from "../../agents/types";
import {
  getSessionAgent,
  updateSessionAgent,
} from "../../features/claude-code-session-state";
import { log } from "../../shared";
import {
  getAgentConfigKey,
  getAgentDisplayName,
} from "../../shared/agent-display-names";

const TOAST_TITLE = "NEVER Use Craftsman with Non-GPT";
const TOAST_MESSAGE = [
  "Craftsman is designed exclusively for GPT models.",
  "Craftsman is trash without GPT.",
  "For Claude/Kimi/GLM models, always use Conductor.",
].join("\n");
const CONDUCTOR_DISPLAY = getAgentDisplayName("conductor");

type NoCraftsmanNonGptHookOptions = {
  allowNonGptModel?: boolean;
};

function showToast(
  ctx: PluginInput,
  sessionID: string,
  variant: "error" | "warning",
): void {
  ctx.client.tui
    .showToast({
      body: {
        title: TOAST_TITLE,
        message: TOAST_MESSAGE,
        variant,
        duration: 10000,
      },
    })
    .catch((error) => {
      log("[no-craftsman-non-gpt] Failed to show toast", {
        sessionID,
        error,
      });
    });
}

export function createNoCraftsmanNonGptHook(
  ctx: PluginInput,
  options?: NoCraftsmanNonGptHookOptions,
) {
  return {
    "chat.message": async (
      input: {
        sessionID: string;
        agent?: string;
        model?: { providerID: string; modelID: string };
      },
      output?: {
        message?: { agent?: string; [key: string]: unknown };
      },
    ): Promise<void> => {
      const rawAgent = input.agent ?? getSessionAgent(input.sessionID) ?? "";
      const agentKey = getAgentConfigKey(rawAgent);
      const modelID = input.model?.modelID;
      const allowNonGptModel = options?.allowNonGptModel === true;

      if (agentKey === "craftsman" && modelID && !isGptModel(modelID)) {
        showToast(ctx, input.sessionID, allowNonGptModel ? "warning" : "error");
        if (allowNonGptModel) {
          return;
        }
        input.agent = CONDUCTOR_DISPLAY;
        if (output?.message) {
          output.message.agent = CONDUCTOR_DISPLAY;
        }
        updateSessionAgent(input.sessionID, CONDUCTOR_DISPLAY);
      }
    },
  };
}
