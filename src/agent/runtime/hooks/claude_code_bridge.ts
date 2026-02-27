import log from "electron-log";
import {
  recordTranscript,
} from "../features/transcript_recorder";
import type { HookHandler, HookRegistry } from "../hook_system";
const logger = log.scope("hook:claude-code-bridge");
type TodoStatus = "pending" | "in_progress" | "completed" | "cancelled";

interface NormalizedTodo {
  content: string;
  status: TodoStatus;
  priority?: string;
}

interface ToolHookInput {
  toolName?: string;
  tool?: string;
  toolCallId?: string;
  callID?: string;
  input?: unknown;
  result?: unknown;
  toolResult?: unknown;
  error?: unknown;
  toolError?: unknown;
}

interface ToolHookOutput {
  args?: unknown;
  result?: unknown;
  output?: unknown;
  toolResult?: unknown;
  toolError?: unknown;
  todoWriteDetected?: boolean;
  todos?: NormalizedTodo[];
  injectedMessages?: Array<{ role: string; content: string }>;
  errorState?: ErrorState;
}

interface TodoInput {
  content?: unknown;
  status?: unknown;
  priority?: unknown;
}

interface ErrorState {
  consecutiveErrors: number;
  totalErrors: number;
  lastErrorTool: string | null;
  lastErrorAt: number | null;
  lastWarningCount: number;
}

interface CompactionState {
  todos: NormalizedTodo[];
  errorState: ErrorState;
}

const toolStartTimes = new Map<string, number>();
const sessionErrorState = new Map<string, ErrorState>();
const compactionSnapshots = new Map<string, CompactionState>();
const errorSpiralStepWarnings = new Set<string>();

function getToolName(input: ToolHookInput): string | undefined {
  if (typeof input.toolName === "string") return input.toolName;
  if (typeof input.tool === "string") return input.tool;
  return undefined;
}

function getToolCallId(input: ToolHookInput): string | undefined {
  if (typeof input.toolCallId === "string") return input.toolCallId;
  if (typeof input.callID === "string") return input.callID;
  return undefined;
}

function getErrorText(input: ToolHookInput, output: ToolHookOutput): string | undefined {
  const candidates = [input.error, input.toolError, output.toolError];
  for (const candidate of candidates) {
    if (typeof candidate === "string" && candidate.trim().length > 0) {
      return candidate;
    }
  }
  return undefined;
}

function stringifyValue(value: unknown): string | undefined {
  if (typeof value === "string") return value;
  if (value === undefined || value === null) return undefined;
  try {
    return JSON.stringify(value);
  } catch {
    return String(value);
  }
}

function getResultText(input: ToolHookInput, output: ToolHookOutput): string | undefined {
  const candidates: unknown[] = [
    input.result,
    input.toolResult,
    output.result,
    output.output,
    output.toolResult,
  ];
  for (const candidate of candidates) {
    const text = stringifyValue(candidate);
    if (text !== undefined) return text;
  }
  return undefined;
}

function normalizeTodoStatus(status: string): TodoStatus | undefined {
  switch (status) {
    case "pending":
    case "in_progress":
    case "completed":
    case "cancelled":
      return status;
    default:
      return undefined;
  }
}

function normalizeTodos(value: unknown): NormalizedTodo[] {
  if (!Array.isArray(value)) return [];
  const todos: NormalizedTodo[] = [];
  for (const item of value) {
    const todo = item as TodoInput;
    if (typeof todo.content !== "string") continue;
    if (typeof todo.status !== "string") continue;
    const status = normalizeTodoStatus(todo.status);
    if (!status) continue;
    todos.push({
      content: todo.content,
      status,
      priority: typeof todo.priority === "string" ? todo.priority : undefined,
    });
  }
  return todos;
}

function getErrorState(sessionId: string): ErrorState {
  const existing = sessionErrorState.get(sessionId);
  if (existing) return existing;
  const created: ErrorState = {
    consecutiveErrors: 0,
    totalErrors: 0,
    lastErrorTool: null,
    lastErrorAt: null,
    lastWarningCount: 0,
  };
  sessionErrorState.set(sessionId, created);
  return created;
}

function pushInjectedMessage(output: ToolHookOutput, content: string): void {
  if (!output.injectedMessages) output.injectedMessages = [];
  output.injectedMessages.push({ role: "system", content });
}

const toolExecuteBefore: HookHandler = async (input, output, ctx) => {
  const inp = input as ToolHookInput;
  const out = output as ToolHookOutput;
  const toolName = getToolName(inp);
  const toolCallId = getToolCallId(inp);
  if (!toolName || !toolCallId) return undefined;

  toolStartTimes.set(toolCallId, Date.now());

  recordTranscript({
    timestamp: Date.now(),
    sessionId: ctx.sessionId,
    chatId: ctx.chatId,
    runId: ctx.runId,
    agentName: ctx.agent,
    type: "tool_call",
    toolName,
    toolCallId,
    input: inp.input ?? out.args,
  });

  return undefined;
};

const toolExecuteAfter: HookHandler = async (input, output, ctx) => {
  const inp = input as ToolHookInput;
  const out = output as ToolHookOutput;
  const toolName = getToolName(inp);
  const toolCallId = getToolCallId(inp);
  if (!toolName || !toolCallId) return undefined;

  const startTime = toolStartTimes.get(toolCallId);
  toolStartTimes.delete(toolCallId);
  const durationMs = startTime ? Date.now() - startTime : undefined;

  recordTranscript({
    timestamp: Date.now(),
    sessionId: ctx.sessionId,
    chatId: ctx.chatId,
    runId: ctx.runId,
    agentName: ctx.agent,
    type: getErrorText(inp, out) ? "tool_error" : "tool_result",
    toolName,
    toolCallId,
    output: getResultText(inp, out),
    error: getErrorText(inp, out),
    durationMs,
  });

  return undefined;
};

const todoWriteNormalizer: HookHandler = async (input, output, ctx) => {
  const inp = input as ToolHookInput;
  const out = output as ToolHookOutput;
  const toolName = getToolName(inp);
  if (!toolName || !toolName.toLowerCase().includes("todo")) return undefined;

  out.todoWriteDetected = true;
  const resultText = getResultText(inp, out);
  if (!resultText) {
    logger.log(`[${ctx.runId}] TodoWrite detected without parseable result`);
    return undefined;
  }

  let parsed: unknown;
  try {
    parsed = JSON.parse(resultText) as unknown;
  } catch {
    parsed = undefined;
  }
  if (!parsed || typeof parsed !== "object") {
    logger.log(`[${ctx.runId}] TodoWrite result is not JSON`);
    return undefined;
  }

  const todos = normalizeTodos((parsed as { todos?: unknown }).todos);
  if (todos.length > 0) out.todos = todos;

  logger.log(`[${ctx.runId}] TodoWrite detected: ${toolName} (${todos.length} normalized todos)`);
  return undefined;
};

const errorStateTracker: HookHandler = async (input, output, ctx) => {
  const inp = input as ToolHookInput;
  const out = output as ToolHookOutput;
  const toolName = getToolName(inp);
  if (!toolName) return undefined;

  const state = getErrorState(ctx.sessionId);
  const error = getErrorText(inp, out);

  if (error) {
    state.consecutiveErrors += 1;
    state.totalErrors += 1;
    state.lastErrorTool = toolName;
    state.lastErrorAt = Date.now();

    if (state.consecutiveErrors >= 3 && state.lastWarningCount < state.consecutiveErrors) {
      pushInjectedMessage(
        out,
        `[ERROR SPIRAL WARNING] ${state.consecutiveErrors} consecutive tool errors detected (last: ${state.lastErrorTool ?? "unknown"}). Stop and reassess before continuing. Check tool parameters and required prerequisites.`,
      );
      state.lastWarningCount = state.consecutiveErrors;
      logger.warn(
        `[${ctx.runId}] Error spiral: ${state.consecutiveErrors} consecutive errors on ${state.lastErrorTool}`,
      );
    }
  } else {
    state.consecutiveErrors = 0;
    state.lastErrorTool = null;
  }

  out.errorState = { ...state };
  return undefined;
};

const errorStateStepAfter: HookHandler = async (input, output, ctx) => {
  const inp = input as { step?: number };
  const out = output as ToolHookOutput;
  const state = getErrorState(ctx.sessionId);
  out.errorState = { ...state };

  if (state.consecutiveErrors < 3) return undefined;

  const stepKey = `${ctx.sessionId}:${ctx.runId ?? "no-run"}:${inp.step ?? -1}`;
  if (errorSpiralStepWarnings.has(stepKey)) return undefined;
  errorSpiralStepWarnings.add(stepKey);

  pushInjectedMessage(
    out,
    `[ERROR SPIRAL WARNING] Session currently has ${state.consecutiveErrors} consecutive tool errors. Pause and adjust your plan before calling more tools.`,
  );
  return undefined;
};

const compactionBefore: HookHandler = async (input, _output, ctx) => {
  const inp = input as { todos?: unknown };
  compactionSnapshots.set(ctx.sessionId, {
    todos: normalizeTodos(inp.todos),
    errorState: { ...getErrorState(ctx.sessionId) },
  });

  logger.log(`[${ctx.runId}] Compaction before: saved state for session ${ctx.sessionId}`);
  recordTranscript({
    timestamp: Date.now(),
    sessionId: ctx.sessionId,
    chatId: ctx.chatId,
    runId: ctx.runId,
    agentName: ctx.agent,
    type: "continuation",
    output: "compaction:before",
  });

  return undefined;
};

const compactionAfter: HookHandler = async (_input, output, ctx) => {
  const snapshot = compactionSnapshots.get(ctx.sessionId);
  if (!snapshot) return undefined;

  const out = output as ToolHookOutput;
  compactionSnapshots.delete(ctx.sessionId);
  sessionErrorState.set(ctx.sessionId, { ...snapshot.errorState });

  if (snapshot.todos.length > 0) out.todos = snapshot.todos;
  out.errorState = { ...snapshot.errorState };

  logger.log(`[${ctx.runId}] Compaction after: restored state for session ${ctx.sessionId}`);
  recordTranscript({
    timestamp: Date.now(),
    sessionId: ctx.sessionId,
    chatId: ctx.chatId,
    runId: ctx.runId,
    agentName: ctx.agent,
    type: "continuation",
    output: "compaction:after",
  });

  return undefined;
};

export function registerClaudeCodeBridgeHook(registry: HookRegistry): void {
  registry.register("tool.execute.before", "ccb:transcript-before", toolExecuteBefore, 5, "global");
  registry.register("tool.execute.after", "ccb:transcript-after", toolExecuteAfter, 5, "global");
  registry.register("tool.execute.after", "ccb:todowrite-normalizer", todoWriteNormalizer, 10, "global");
  registry.register("tool.execute.after", "ccb:error-state", errorStateTracker, 15, "global");
  registry.register("agent.step.after", "ccb:error-state-step", errorStateStepAfter, 20, "session");
  registry.register("compaction.before", "ccb:compaction-before", compactionBefore, 50, "global");
  registry.register("compaction.after", "ccb:compaction-after", compactionAfter, 50, "global");
}
