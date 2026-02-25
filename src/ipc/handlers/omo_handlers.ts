import log from "electron-log";
import { getAllAgentDefinitions } from "../../agent/runtime/agents";
import { omoContracts } from "../types/omo";
import { createTypedHandler } from "./base";
import { activeOmoContexts } from "./chat_stream_handlers";

const logger = log.scope("omo-handlers");

export function registerOmoHandlers() {
  // agent:list — return all registered agent definitions
  createTypedHandler(omoContracts.listAgents, async () => {
    const agents = getAllAgentDefinitions();
    return agents.map((a) => ({
      id: a.name,
      name: a.name,
      description: a.description,
      kind: a.mode === "primary" ? ("primary" as const) : ("subagent" as const),
      modelId: a.model.modelId,
      icon: undefined,
    }));
  });

  // agent:select — store selected agent for chat
  createTypedHandler(omoContracts.selectAgent, async (_event, _input) => {
    // TODO: Wire to session state when agent selection UI is built
    return { success: true };
  });

  // background:list — list background tasks for a chat
  createTypedHandler(
    omoContracts.listBackgroundTasks,
    async (_event, input) => {
      const omoCtx = activeOmoContexts.get(input.chatId);
      if (!omoCtx) return [];

      const tasks = omoCtx.backgroundManager.getAllTasks();
      return tasks.map((t) => ({
        taskId: t.id,
        agentName: t.agentName,
        description: t.description,
        status: t.status,
        startedAt: new Date(t.startedAt).toISOString(),
        completedAt: t.completedAt
          ? new Date(t.completedAt).toISOString()
          : undefined,
        error: t.error,
      }));
    },
  );

  // background:output — get output of a background task
  createTypedHandler(
    omoContracts.getBackgroundOutput,
    async (_event, input) => {
      // Find the task across all active OMO contexts
      for (const omoCtx of activeOmoContexts.values()) {
        const output = omoCtx.backgroundManager.getTaskOutput(input.taskId);
        if (output !== undefined) {
          return {
            output:
              typeof output === "string" ? output : JSON.stringify(output),
          };
        }
      }
      return { output: null };
    },
  );

  // background:cancel — cancel a background task
  createTypedHandler(
    omoContracts.cancelBackgroundTask,
    async (_event, input) => {
      for (const omoCtx of activeOmoContexts.values()) {
        try {
          omoCtx.backgroundManager.cancelTask(input.taskId);
          return { success: true };
        } catch {
          // Task not found in this context, try next
        }
      }
      return { success: false };
    },
  );

  // skill:list — list available skills from any active OMO context
  createTypedHandler(omoContracts.listSkills, async (_event, _input) => {
    // Use the most recent OMO context
    const omoCtx = [...activeOmoContexts.values()].pop();
    if (!omoCtx) return [];

    return omoCtx.skillLoader.list().map((s) => ({
      name: s.name,
      description: s.description,
      scope: normalizeScope(s.scope),
      active: s.hasMcp,
    }));
  });

  // skill:load — load a skill
  createTypedHandler(omoContracts.loadSkill, async (_event, input) => {
    const omoCtx = [...activeOmoContexts.values()].pop();
    if (!omoCtx) throw new Error("No active OMO runtime");

    const skill = omoCtx.skillLoader.get(input.skillName);
    if (!skill) throw new Error(`Skill not found: ${input.skillName}`);
    return { success: true };
  });

  // command:list — list available commands
  createTypedHandler(omoContracts.listCommands, async () => {
    const omoCtx = [...activeOmoContexts.values()].pop();
    if (!omoCtx) return [];

    return omoCtx.commandRegistry.list().map((c) => ({
      name: c.name,
      description: c.description,
      scope: normalizeCommandScope(c.scope),
    }));
  });
}

/** Map internal scope strings to the IPC schema enum */
function normalizeScope(
  scope: string,
): "builtin" | "user" | "project" | "opencode" {
  switch (scope) {
    case "builtin":
      return "builtin";
    case "user":
      return "user";
    case "project":
      return "project";
    case "opencode":
    case "global":
      return "opencode";
    default:
      return "builtin";
  }
}

function normalizeCommandScope(scope: string): "builtin" | "user" | "project" {
  switch (scope) {
    case "user":
      return "user";
    case "project":
      return "project";
    default:
      return "builtin";
  }
}
