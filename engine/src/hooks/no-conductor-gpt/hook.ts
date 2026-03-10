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

const TOAST_TITLE = "NEVER Use Conductor with GPT";
const TOAST_MESSAGE = [
  "Conductor works best with Claude Opus, and works fine with Kimi/GLM models.",
  "Do NOT use Conductor with GPT.",
  "For GPT models, always use Craftsman.",
].join("\n");
const CRAFTSMAN_DISPLAY = getAgentDisplayName("craftsman");

function showToast(ctx: PluginInput, sessionID: string): void {
  ctx.client.tui
    .showToast({
      body: {
        title: TOAST_TITLE,
        message: TOAST_MESSAGE,
        variant: "error",
        duration: 10000,
      },
    })
    .catch((error) => {
      log("[no-conductor-gpt] Failed to show toast", {
        sessionID,
        error,
      });
    });
}

export function createNoConductorGptHook(ctx: PluginInput) {
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

      if (agentKey === "conductor" && modelID && isGptModel(modelID)) {
        showToast(ctx, input.sessionID);
        input.agent = CRAFTSMAN_DISPLAY;
        if (output?.message) {
          output.message.agent = CRAFTSMAN_DISPLAY;
        }
        updateSessionAgent(input.sessionID, CRAFTSMAN_DISPLAY);
      }
    },
  };
}
