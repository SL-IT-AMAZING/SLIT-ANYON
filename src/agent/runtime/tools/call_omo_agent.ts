import { z } from "zod";

import { getModelClient } from "@/ipc/utils/get_model_client";
import { readSettings } from "@/main/settings";

import type { AgentRuntimeParams } from "../agent_runtime";
import { getAgentDefinition } from "../agents/register_all";
import type { SpawnParams } from "../background_manager";
import { createDefaultRegistry } from "../tool_registry";
import type { NativeTool } from "../tool_interface";
import type { StreamCallbacks } from "../types";

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
  agent_type: z.string(),
  prompt: z.string(),
  description: z.string(),
  run_in_background: z.boolean().optional(),
});

type CallOmoAgentInput = z.infer<typeof parameters>;

export const callOmoAgentTool: NativeTool<CallOmoAgentInput> = {
  id: "mcp_call_agent",
  description: "Invoke an OMO agent directly",
  parameters,
  riskLevel: "safe",
  execute: async (input, context) => {
    if (!context.backgroundManager) {
      return "BackgroundManager is not available in this runtime.";
    }

    const agentDef = getAgentDefinition(input.agent_type);
    if (!agentDef) {
      return `Unknown agent type: ${input.agent_type}`;
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
      return `Task started in background.\n**Task ID:** ${taskId}\n**Agent:** ${agentDef.name}\n**Description:** ${input.description}`;
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
