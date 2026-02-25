import { getAllAgentDefinitions } from "../../agent/runtime/agents";
import { omoContracts } from "../types/omo";
import { createTypedHandler } from "./base";

export function registerOmoHandlers() {
  createTypedHandler(omoContracts.listAgents, async () => {
    const agents = getAllAgentDefinitions();

    return agents.map((a) => ({
      id: a.name,
      name: a.name,
      description: a.description,
      kind: a.mode === "primary" ? "primary" : "subagent",
      modelId: a.model.modelId,
      icon: undefined,
    }));
  });

  createTypedHandler(omoContracts.selectAgent, async (_event, _input) => {
    return { success: true };
  });

  createTypedHandler(
    omoContracts.listBackgroundTasks,
    async (_event, _input) => {
      return [];
    },
  );

  createTypedHandler(
    omoContracts.getBackgroundOutput,
    async (_event, _input) => {
      return { output: null };
    },
  );

  createTypedHandler(
    omoContracts.cancelBackgroundTask,
    async (_event, _input) => {
      return { success: true };
    },
  );

  createTypedHandler(omoContracts.listSkills, async (_event, _input) => {
    return [];
  });

  createTypedHandler(omoContracts.loadSkill, async (_event, _input) => {
    return { success: true };
  });

  createTypedHandler(omoContracts.listCommands, async (_event, _input) => {
    return [];
  });
}
