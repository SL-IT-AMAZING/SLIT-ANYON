import { eq } from "drizzle-orm";
import log from "electron-log";

import { db } from "@/db";
import { todoItems } from "@/db/schema";

const logger = log.scope("boulder-state");

export interface BoulderData {
  totalTodos: number;
  completedTodos: number;
  pendingTodos: number;
  isActive: boolean;
  startedAt: string;
}

export class BoulderState {
  async save(chatId: number, runId: string, data: BoulderData): Promise<void> {
    try {
      logger.debug(
        `Boulder state for chat ${chatId}, run ${runId}: ${data.completedTodos}/${data.totalTodos} complete`,
      );
    } catch (err) {
      logger.warn("Failed to save boulder state:", err);
    }
  }

  async load(chatId: number): Promise<BoulderData | null> {
    try {
      const todos = await db
        .select()
        .from(todoItems)
        .where(eq(todoItems.chatId, chatId));
      if (todos.length === 0) {
        return null;
      }

      const completedTodos = todos.filter(
        (todo) => todo.status === "completed",
      ).length;
      const pendingTodos = todos.filter(
        (todo) => todo.status !== "completed" && todo.status !== "cancelled",
      ).length;

      const createdAt = todos[0]?.createdAt;
      const startedAt =
        createdAt instanceof Date
          ? createdAt.toISOString()
          : typeof createdAt === "number"
            ? new Date(createdAt * 1000).toISOString()
            : new Date().toISOString();

      return {
        totalTodos: todos.length,
        completedTodos,
        pendingTodos,
        isActive: pendingTodos > 0,
        startedAt,
      };
    } catch (err) {
      logger.warn("Failed to load boulder state:", err);
      return null;
    }
  }

  async clear(chatId: number): Promise<void> {
    try {
      await db.delete(todoItems).where(eq(todoItems.chatId, chatId));
    } catch (err) {
      logger.warn("Failed to clear boulder state:", err);
    }
  }
}
