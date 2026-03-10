import type { AnyonConfig } from "../config";
import { getAgentDisplayName } from "../shared/agent-display-names";

type AgentWithPermission = { permission?: Record<string, unknown> };

function agentByKey(
  agentResult: Record<string, unknown>,
  key: string,
): AgentWithPermission | undefined {
  return (agentResult[key] ?? agentResult[getAgentDisplayName(key)]) as
    | AgentWithPermission
    | undefined;
}

export function applyToolConfig(params: {
  config: Record<string, unknown>;
  pluginConfig: AnyonConfig;
  agentResult: Record<string, unknown>;
}): void {
  const denyTodoTools = params.pluginConfig.experimental?.task_system
    ? { todowrite: "deny", todoread: "deny" }
    : {};

  params.config.tools = {
    ...(params.config.tools as Record<string, unknown>),
    "grep_app_*": false,
    LspHover: false,
    LspCodeActions: false,
    LspCodeActionResolve: false,
    "task_*": false,
    teammate: false,
    ...(params.pluginConfig.experimental?.task_system
      ? { todowrite: false, todoread: false }
      : {}),
  };

  const isCliRunMode = process.env.OPENCODE_CLI_RUN_MODE === "true";
  const questionPermission = isCliRunMode ? "deny" : "allow";

  const researcher = agentByKey(params.agentResult, "researcher");
  if (researcher) {
    researcher.permission = { ...researcher.permission, "grep_app_*": "allow" };
  }
  const looker = agentByKey(params.agentResult, "inspector");
  if (looker) {
    looker.permission = { ...looker.permission, task: "deny", look_at: "deny" };
  }
  const taskmaster = agentByKey(params.agentResult, "taskmaster");
  if (taskmaster) {
    taskmaster.permission = {
      ...taskmaster.permission,
      task: "allow",
      call_anyon_agent: "deny",
      "task_*": "allow",
      teammate: "allow",
      ...denyTodoTools,
    };
  }
  const conductor = agentByKey(params.agentResult, "conductor");
  if (conductor) {
    conductor.permission = {
      ...conductor.permission,
      call_anyon_agent: "deny",
      task: "allow",
      question: questionPermission,
      "task_*": "allow",
      teammate: "allow",
      ...denyTodoTools,
    };
  }
  const craftsman = agentByKey(params.agentResult, "craftsman");
  if (craftsman) {
    craftsman.permission = {
      ...craftsman.permission,
      call_anyon_agent: "deny",
      task: "allow",
      question: questionPermission,
      ...denyTodoTools,
    };
  }
  const strategist = agentByKey(params.agentResult, "strategist");
  if (strategist) {
    strategist.permission = {
      ...strategist.permission,
      call_anyon_agent: "deny",
      task: "allow",
      question: questionPermission,
      "task_*": "allow",
      teammate: "allow",
      ...denyTodoTools,
    };
  }
  const junior = agentByKey(params.agentResult, "worker");
  if (junior) {
    junior.permission = {
      ...junior.permission,
      task: "allow",
      "task_*": "allow",
      teammate: "allow",
      ...denyTodoTools,
    };
  }

  params.config.permission = {
    webfetch: "allow",
    external_directory: "allow",
    ...(params.config.permission as Record<string, unknown>),
    task: "deny",
  };
}
