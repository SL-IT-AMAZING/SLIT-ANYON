import type { AgentTodo } from "@/ipc/types";

type TodoLike = {
  id?: unknown;
  content?: unknown;
  status?: unknown;
};

function isTodoStatus(
  status: unknown,
): status is "pending" | "in_progress" | "completed" {
  return (
    status === "pending" || status === "in_progress" || status === "completed"
  );
}

function normalizeTodos(value: unknown): AgentTodo[] | null {
  if (!Array.isArray(value)) {
    return null;
  }

  const normalized: AgentTodo[] = [];
  for (const [index, item] of value.entries()) {
    const todo = item as TodoLike;
    if (typeof todo?.content !== "string" || todo.content.trim().length === 0) {
      continue;
    }
    normalized.push({
      id:
        typeof todo.id === "string" && todo.id.length > 0
          ? todo.id
          : `todo-${index}-${todo.content}`,
      content: todo.content,
      status: isTodoStatus(todo.status) ? todo.status : "pending",
    });
  }

  return normalized;
}

function parseJsonCandidate(raw: string): unknown {
  const trimmed = raw.trim();
  if (!trimmed) return null;

  try {
    return JSON.parse(trimmed);
  } catch {}

  const fenced = trimmed.match(/```(?:json)?\s*([\s\S]*?)\s*```/i);
  if (fenced?.[1]) {
    try {
      return JSON.parse(fenced[1].trim());
    } catch {}
  }

  const firstBrace = trimmed.indexOf("{");
  const firstBracket = trimmed.indexOf("[");
  const startCandidates = [firstBrace, firstBracket].filter((v) => v >= 0);
  if (startCandidates.length === 0) return null;
  const start = Math.min(...startCandidates);

  const lastBrace = trimmed.lastIndexOf("}");
  const lastBracket = trimmed.lastIndexOf("]");
  const end = Math.max(lastBrace, lastBracket);
  if (end <= start) return null;

  try {
    return JSON.parse(trimmed.slice(start, end + 1));
  } catch {
    return null;
  }
}

function extractTodosFromOpenCodeToolContent(
  content: string,
): AgentTodo[] | null {
  const parsed = parseJsonCandidate(content);
  if (!parsed) return null;

  const direct = normalizeTodos(parsed);
  if (direct) return direct;

  if (typeof parsed !== "object" || parsed === null) {
    return null;
  }

  const record = parsed as Record<string, unknown>;
  return (
    normalizeTodos(record.todos) ??
    normalizeTodos(
      (record.input as Record<string, unknown> | undefined)?.todos,
    ) ??
    normalizeTodos(
      (record.metadata as Record<string, unknown> | undefined)?.todos,
    )
  );
}

export function extractLatestTodosFromAssistantMessage(
  content: string,
): AgentTodo[] | null {
  const regex = /<opencode-tool\s+([^>]*)>([\s\S]*?)<\/opencode-tool>/gi;
  const matches: Array<{ attrs: string; body: string }> = [];
  let match: RegExpExecArray | null;
  for (;;) {
    match = regex.exec(content);
    if (match === null) break;
    matches.push({ attrs: match[1] ?? "", body: match[2] ?? "" });
  }

  for (let index = matches.length - 1; index >= 0; index -= 1) {
    const attrs = matches[index].attrs;
    const nameMatch = attrs.match(/\bname="([^"]+)"/i);
    const toolName = nameMatch?.[1]?.toLowerCase();
    if (toolName !== "todowrite" && toolName !== "todoread") {
      continue;
    }
    const todos = extractTodosFromOpenCodeToolContent(matches[index].body);
    if (todos) {
      return todos;
    }
  }

  return null;
}
