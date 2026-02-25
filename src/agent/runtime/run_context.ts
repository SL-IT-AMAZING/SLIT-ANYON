import { randomUUID } from "node:crypto";

export interface RunContext {
  runId: string;
  rootChatId: number;
  chatId: number;
  parentRunId?: string;
  agentName: string;
  agentKind: "primary" | "subagent";
  isSubAgent: boolean;
}

export function generateRunId(): string {
  return randomUUID();
}

export function createPrimaryRunContext(opts: {
  chatId: number;
  agentName: string;
}): RunContext {
  return {
    runId: generateRunId(),
    rootChatId: opts.chatId,
    chatId: opts.chatId,
    agentName: opts.agentName,
    agentKind: "primary",
    isSubAgent: false,
  };
}

export function createSubAgentRunContext(opts: {
  parentRunId: string;
  rootChatId: number;
  chatId: number;
  agentName: string;
}): RunContext {
  return {
    runId: generateRunId(),
    rootChatId: opts.rootChatId,
    chatId: opts.chatId,
    parentRunId: opts.parentRunId,
    agentName: opts.agentName,
    agentKind: "subagent",
    isSubAgent: true,
  };
}
