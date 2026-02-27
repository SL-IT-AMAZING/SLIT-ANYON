import { and, eq, inArray } from "drizzle-orm";
import log from "electron-log";

import { db } from "@/db";
import { todoItems } from "@/db/schema";

const logger = log.scope("todo-store");

export interface TodoItem {
  content: string;
  status: "pending" | "in_progress" | "completed" | "cancelled";
  priority: "high" | "medium" | "low";
}

export class TodoStore {
  async upsertTodos(
    runId: string,
    chatId: number,
    todos: TodoItem[],
  ): Promise<void> {
    await db.delete(todoItems).where(eq(todoItems.runId, runId));

    if (todos.length === 0) {
      return;
    }

    const now = new Date();
    await db.insert(todoItems).values(
      todos.map((todo) => ({
        runId,
        chatId,
        content: todo.content,
        status: todo.status,
        priority: todo.priority,
        createdAt: now,
        updatedAt: now,
      })),
    );

    logger.debug(`Upserted ${todos.length} todos for run ${runId}`);
  }

  async getTodos(runId: string): Promise<TodoItem[]> {
    const rows = await db
      .select()
      .from(todoItems)
      .where(eq(todoItems.runId, runId));

    return rows.map((row) => ({
      content: row.content,
      status: row.status,
      priority: row.priority,
    }));
  }

  async getTodosByChatId(chatId: number): Promise<TodoItem[]> {
    const rows = await db
      .select()
      .from(todoItems)
      .where(eq(todoItems.chatId, chatId));

    return rows.map((row) => ({
      content: row.content,
      status: row.status,
      priority: row.priority,
    }));
  }

  async getIncompleteTodos(runId: string): Promise<TodoItem[]> {
    const rows = await db
      .select()
      .from(todoItems)
      .where(
        and(
          eq(todoItems.runId, runId),
          inArray(todoItems.status, ["pending", "in_progress"]),
        ),
      );

    return rows.map((row) => ({
      content: row.content,
      status: row.status,
      priority: row.priority,
    }));
  }

  async clearTodos(runId: string): Promise<void> {
    await db.delete(todoItems).where(eq(todoItems.runId, runId));
  }
}

let store: TodoStore | null = null;

export function getTodoStore(): TodoStore {
  if (!store) {
    store = new TodoStore();
  }

  return store;
}
