import { z } from "zod";

import { getModelClient } from "@/ipc/utils/get_model_client";
import { readSettings } from "@/main/settings";

import type { AgentRuntimeParams } from "../agent_runtime";
import { getAgentDefinition } from "../agents/register_all";
import type { SpawnParams } from "../background_manager";
import { createDefaultRegistry } from "../tool_registry";
import type { NativeTool } from "../tool_interface";
import type { StreamCallbacks } from "../types";

const CATEGORY_AGENT_MAP: Record<string, string> = {
  "visual-engineering": "sisyphus-junior",
  ultrabrain: "oracle",
  deep: "sisyphus-junior",
  artistry: "sisyphus-junior",
  quick: "sisyphus-junior",
  "unspecified-low": "sisyphus-junior",
  "unspecified-high": "sisyphus-junior",
  writing: "sisyphus-junior",
};

const noopCallbacks: StreamCallbacks = {
  onTextDelta: () => {},
  onReasoningDelta: () => {},
  onToolCall: () => {},
  onToolResult: () => {},
  onToolError: () => {},
  onStepFinish: () => {},
  onFinish: () => {},
  onError: () => {},
};

const parameters = z.object({
  description: z.string(),
  prompt: z.string(),
  category: z.string().optional(),
  load_skills: z.array(z.string()).optional(),
  run_in_background: z.boolean().optional(),
  session_id: z.string().optional(),
  subagent_type: z.string().optional(),
  command: z.string().optional(),
});

type DelegateTaskInput = z.infer<typeof parameters>;

function resolveAgentName(input: DelegateTaskInput): string {
  if (input.subagent_type) {
    return input.subagent_type;
  }

  if (!input.category) {
    return "sisyphus-junior";
  }

  if (input.category === "explore") {
    return "explore";
  }

  if (input.category === "oracle") {
    return "oracle";
  }

  return CATEGORY_AGENT_MAP[input.category] ?? "sisyphus-junior";
}

export const delegateTaskTool: NativeTool<DelegateTaskInput> = {
  id: "mcp_task",
  description: "Delegate a task to a sub-agent runtime",
  parameters,
  riskLevel: "safe",
  execute: async (input, context) => {
    if (!context.backgroundManager) {
      return "BackgroundManager is not available in this runtime.";
    }

    const agentName = resolveAgentName(input);
    const agentDef = getAgentDefinition(agentName);
    if (!agentDef) {
      return `Unknown agent type: ${agentName}`;
    }

    const { modelClient } = await getModelClient(
      {
        provider: agentDef.model.provider,
        name: agentDef.model.modelId,
      },
      readSettings(),
    );

    const registry = createDefaultRegistry();
    const runInBackground = input.run_in_background ?? true;

    const spawnParams: SpawnParams = {
      agentName: agentDef.name,
      prompt: input.prompt,
      description: input.description,
      parentRunContext: context.runContext!,
      parentAbort: context.abort,
      runInBackground,
      runtimeFactory: (childRunContext, childAbort): AgentRuntimeParams => ({
        chatId: context.chatId,
        assistantMessageId: -1,
        sessionId: context.sessionId,
        appPath: context.appPath,
        model: modelClient.model,
        systemPrompt: [input.prompt],
        registry,
        toolContext: {
          ...context,
          abort: childAbort.signal,
          runId: childRunContext.runId,
        },
        callbacks: noopCallbacks,
        agentConfig: {
          name: agentDef.name,
          description: agentDef.description,
          steps: Infinity,
          tools: agentDef.tools,
          mode: agentDef.mode as "primary" | "subagent" | "all",
        },
        runContext: childRunContext,
      }),
    };

    const taskId = await context.backgroundManager.spawnAgent(spawnParams);

    if (runInBackground) {
      return `Task started in background.\n**Task ID:** ${taskId}\n**Agent:** ${agentName}\n**Description:** ${input.description}`;
    }

    const output = context.backgroundManager.getTaskOutput(taskId);
    if (!output) {
      return `Task failed: no output available for task ${taskId}`;
    }

    if (output.status === "error" || output.status === "cancelled") {
      return `Task failed: ${output.error ?? `Task ended with status ${output.status}`}`;
    }

    return output.result ?? "Task completed with no output.";
  },
};
