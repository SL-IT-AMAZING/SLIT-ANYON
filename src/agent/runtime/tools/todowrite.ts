import { z } from "zod";

import type { NativeTool } from "../tool_interface";
import { getTodoStore, type TodoItem } from "../todo_store";

const parameters = z.object({
  todos: z
    .array(
      z.object({
        content: z.string().describe("Brief description of the task"),
        status: z
          .enum(["pending", "in_progress", "completed", "cancelled"])
          .describe("Current status of the task"),
        priority: z
          .enum(["high", "medium", "low"])
          .describe("Priority level of the task")
          .default("medium"),
      }),
    )
    .describe("The updated todo list"),
});

type TodoWriteInput = z.infer<typeof parameters>;

export const todoWriteTool: NativeTool<TodoWriteInput> = {
  id: "todowrite",
  description:
    "Create or update the current todo list. Use this to track progress on multi-step tasks.",
  parameters,
  riskLevel: "safe",
  async execute(input, context) {
    const store = getTodoStore();
    const todos: TodoItem[] = input.todos.map((todo) => ({
      content: todo.content,
      status: todo.status,
      priority: todo.priority ?? "medium",
    }));

    const runId = context.runId ?? `chat-${context.chatId}`;
    await store.upsertTodos(runId, context.chatId, todos);

    const summary = todos
      .map((todo) => {
        const icon =
          todo.status === "completed"
            ? "✅"
            : todo.status === "in_progress"
              ? "🔄"
              : todo.status === "cancelled"
                ? "❌"
                : "⬜";
        return `${icon} [${todo.priority}] ${todo.content}`;
      })
      .join("\n");

    return `Todo list updated (${todos.length} items):\n${summary}`;
  },
};
