import log from "electron-log";

import type { HookHandler, HookRegistry } from "../hook_system";
import type { ContinuationRequest, LoopResult } from "../types";

const logger = log.scope("hook:atlas");

const ORCHESTRATOR_AGENT_HINTS = ["sisyphus", "orchestrator", "ultrawork"];
const VERIFICATION_INTERVAL = 5;

const TODO_CONTINUATION_MESSAGE =
  "[SYSTEM REMINDER - TODO CONTINUATION] Incomplete tasks remain in your " +
  "todo list. Continue working on the next pending task. Proceed without " +
  "asking for permission. Mark each task complete when finished. Do not " +
  "stop until all tasks are done.";

type TodoStatus = "pending" | "in_progress" | "completed" | "cancelled";

interface TodoEntry {
  content: string;
  status: TodoStatus | string;
  priority?: string;
}

interface TurnStopInput {
  finishReason: LoopResult;
  autoContinueCount: number;
  maxAutoContinues: number;
}

interface TurnStopOutput {
  continuationQueue: ContinuationRequest[];
}

interface SessionTodoState {
  todos: TodoEntry[];
  lastUpdatedAt: number;
}

interface TodoExtractionResult {
  todos: TodoEntry[];
  found: boolean;
}

const sessionTodoState = new Map<string, SessionTodoState>();

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function asString(value: unknown): string | null {
  return typeof value === "string" ? value : null;
}

function asStatus(value: unknown): TodoStatus | string | null {
  if (typeof value !== "string") return null;
  return value;
}

function asTodoEntry(value: unknown): TodoEntry | null {
  if (!isRecord(value)) return null;

  const content = asString(value.content);
  const status = asStatus(value.status);
  if (!content || !status) {
    return null;
  }

  const priority = asString(value.priority) ?? undefined;
  return { content, status, priority };
}

function normalizeTodos(raw: unknown): TodoEntry[] {
  if (!Array.isArray(raw)) return [];

  const normalized: TodoEntry[] = [];
  for (const item of raw) {
    const todo = asTodoEntry(item);
    if (todo) normalized.push(todo);
  }
  return normalized;
}

function extractTodosFromObject(
  obj: Record<string, unknown>,
): TodoExtractionResult {
  if (Array.isArray(obj.todos)) {
    return { todos: normalizeTodos(obj.todos), found: true };
  }

  if (Array.isArray(obj.todoList)) {
    return { todos: normalizeTodos(obj.todoList), found: true };
  }

  if (isRecord(obj.result)) {
    const nested = extractTodosFromObject(obj.result);
    if (nested.found) return nested;
  }

  if (Array.isArray(obj.results)) {
    for (const result of obj.results) {
      if (isRecord(result)) {
        const nested = extractTodosFromObject(result);
        if (nested.found) return nested;
      }
    }
  }

  if (Array.isArray(obj.toolResults)) {
    for (const result of obj.toolResults) {
      if (isRecord(result)) {
        const nested = extractTodosFromObject(result);
        if (nested.found) return nested;
      }
    }
  }

  return { todos: [], found: false };
}

function extractTodos(input: unknown, output: unknown): TodoExtractionResult {
  for (const src of [output, input]) {
    if (!isRecord(src)) continue;
    const extracted = extractTodosFromObject(src);
    if (extracted.found) {
      return extracted;
    }
  }
  return { todos: [], found: false };
}

function isIncomplete(todo: TodoEntry): boolean {
  return todo.status === "pending" || todo.status === "in_progress";
}

function isInProgress(todo: TodoEntry): boolean {
  return todo.status === "in_progress";
}

function isOrchestratorAgent(agentName: string): boolean {
  const normalized = agentName.toLowerCase();
  return ORCHESTRATOR_AGENT_HINTS.some((hint) => normalized.includes(hint));
}

function isOrchestratorFromSignals(input: TurnStopInput): boolean {
  const maybeInput = input as unknown;
  if (!isRecord(maybeInput)) return false;

  const direct = maybeInput.isOrchestratorRun;
  if (typeof direct === "boolean") {
    return direct;
  }

  const viaRunInfo = isRecord(maybeInput.runInfo) ? maybeInput.runInfo : null;
  if (viaRunInfo && typeof viaRunInfo.isOrchestratorRun === "boolean") {
    return viaRunInfo.isOrchestratorRun;
  }

  return false;
}

function continuationAtLimit(input: TurnStopInput): boolean {
  return input.autoContinueCount >= input.maxAutoContinues;
}

function shouldEmitVerificationCheckpoint(input: TurnStopInput): boolean {
  const nextCount = input.autoContinueCount + 1;
  return nextCount > 0 && nextCount % VERIFICATION_INTERVAL === 0;
}

function buildVerificationMessage(input: TurnStopInput): string {
  const nextCount = input.autoContinueCount + 1;
  return `[VERIFICATION CHECKPOINT] You have completed ${nextCount} auto-continuations. Before proceeding, verify:\n- Are completed tasks actually done correctly?\n- Are there any failing builds/tests?\n- Is the approach still correct?`;
}

function buildDelegationReminder(): string {
  return "[DELEGATION REMINDER] Remember: as orchestrator, DELEGATE specialized work to sub-agents. Do not implement directly unless the task is trivial.";
}

function buildFocusReminder(inProgress: TodoEntry): string {
  return `[FOCUS] Focus on the current task. Complete it before moving to the next. Current task: "${inProgress.content}".`;
}

function getSessionTodos(sessionId: string): TodoEntry[] {
  const state = sessionTodoState.get(sessionId);
  return state?.todos ?? [];
}

function setSessionTodos(sessionId: string, todos: TodoEntry[]): void {
  sessionTodoState.set(sessionId, {
    todos,
    lastUpdatedAt: Date.now(),
  });
}

function getTurnStopInput(input: unknown): TurnStopInput | null {
  if (!isRecord(input)) return null;

  const finishReason = asString(input.finishReason);
  const autoContinueCount = input.autoContinueCount;
  const maxAutoContinues = input.maxAutoContinues;
  if (
    !finishReason ||
    typeof autoContinueCount !== "number" ||
    typeof maxAutoContinues !== "number"
  ) {
    return null;
  }

  return {
    finishReason: finishReason as LoopResult,
    autoContinueCount,
    maxAutoContinues,
  };
}

function getTurnStopOutput(output: unknown): TurnStopOutput | null {
  if (!isRecord(output)) return null;
  const queue = output.continuationQueue;
  if (!Array.isArray(queue)) return null;

  return { continuationQueue: queue as ContinuationRequest[] };
}

const todoTracker: HookHandler = async (input, output, ctx) => {
  const extracted = extractTodos(input, output);
  if (!extracted.found) {
    return undefined;
  }

  setSessionTodos(ctx.sessionId, extracted.todos);

  const incomplete = extracted.todos.filter(isIncomplete).length;
  logger.log(
    `[${ctx.runId ?? "no-run"}] Atlas todo tracker: session=${ctx.sessionId} ` +
      `todos=${extracted.todos.length} incomplete=${incomplete}`,
  );

  return undefined;
};

const turnStopHandler: HookHandler = async (input, output, ctx) => {
  const inp = getTurnStopInput(input);
  const out = getTurnStopOutput(output);
  if (!inp || !out) {
    logger.warn("Atlas: unexpected turn.stop input/output shape");
    return undefined;
  }

  if (continuationAtLimit(inp)) {
    logger.warn(
      `[${ctx.runId ?? "no-run"}] Atlas: continuation limit reached ` +
        `(${inp.autoContinueCount}/${inp.maxAutoContinues}), not requesting continuation`,
    );
    return undefined;
  }

  const todos = getSessionTodos(ctx.sessionId);
  const incompleteTodos = todos.filter(isIncomplete);

  if (incompleteTodos.length === 0) {
    logger.log(
      `[${ctx.runId ?? "no-run"}] Atlas: all todos complete (or none tracked), natural stop`,
    );
    return undefined;
  }

  const inProgressTodos = todos.filter(isInProgress);
  const reminderParts: string[] = [];

  reminderParts.push(TODO_CONTINUATION_MESSAGE);

  const orchestrator =
    isOrchestratorAgent(ctx.agent) || isOrchestratorFromSignals(inp);
  if (orchestrator) {
    reminderParts.push(buildDelegationReminder());
  }

  if (shouldEmitVerificationCheckpoint(inp)) {
    reminderParts.push(buildVerificationMessage(inp));
  }

  if (inProgressTodos.length === 1) {
    reminderParts.push(buildFocusReminder(inProgressTodos[0]));
  }

  out.continuationQueue.push({
    content: reminderParts.join("\n\n"),
    reason: `atlas:${incompleteTodos.length}-incomplete-todos`,
    visible: false,
  });

  logger.log(
    `[${ctx.runId ?? "no-run"}] Atlas: requesting continuation #${inp.autoContinueCount + 1} ` +
      `(remaining=${incompleteTodos.length}, orchestrator=${orchestrator})`,
  );

  return undefined;
};

export function registerAtlasHook(registry: HookRegistry): void {
  registry.register(
    "agent.step.after",
    "atlas:todo-tracker",
    todoTracker,
    85,
    "run",
  );
  registry.register(
    "agent.turn.stop",
    "atlas:continuation",
    turnStopHandler,
    50,
    "run",
  );
}
