import { asc, eq } from "drizzle-orm";
import log from "electron-log";
import { z } from "zod";

import { db } from "@/db";
import { chats, messages, todoItems } from "@/db/schema";

import type { NativeTool } from "../tool_interface";

const logger = log.scope("tool.session_read");

const parameters = z.object({
  session_id: z.string(),
  include_todos: z.boolean().optional(),
  include_transcript: z.boolean().optional(),
  limit: z.number().optional(),
});

type SessionReadInput = z.infer<typeof parameters>;

function toChatId(sessionId: string): number {
  const chatId = Number(sessionId);
  if (!Number.isInteger(chatId) || chatId <= 0) {
    throw new Error(`Invalid session_id: ${sessionId}`);
  }
  return chatId;
}

export const sessionReadTool: NativeTool<SessionReadInput> = {
  id: "mcp_session_read",
  description: "Read message history for a session",
  parameters,
  riskLevel: "safe",
  execute: async (input) => {
    const chatId = toChatId(input.session_id);
    const rowLimit = Math.max(1, Math.min(input.limit ?? 100, 1000));

    const chat = await db
      .select({
        id: chats.id,
        title: chats.title,
        createdAt: chats.createdAt,
      })
      .from(chats)
      .where(eq(chats.id, chatId))
      .limit(1);

    if (chat.length === 0) {
      throw new Error(`Session not found: ${input.session_id}`);
    }

    const chatMessages = await db
      .select({
        id: messages.id,
        role: messages.role,
        content: messages.content,
        createdAt: messages.createdAt,
      })
      .from(messages)
      .where(eq(messages.chatId, chatId))
      .orderBy(asc(messages.createdAt))
      .limit(rowLimit);

    const todos = input.include_todos
      ? await db
          .select({
            content: todoItems.content,
            status: todoItems.status,
            priority: todoItems.priority,
            updatedAt: todoItems.updatedAt,
          })
          .from(todoItems)
          .where(eq(todoItems.chatId, chatId))
          .orderBy(asc(todoItems.updatedAt))
      : undefined;

    logger.debug("Read session", {
      chatId,
      messages: chatMessages.length,
      includeTodos: Boolean(input.include_todos),
    });

    return JSON.stringify(
      {
        session_id: String(chat[0].id),
        title: chat[0].title ?? "Untitled Chat",
        created_at: chat[0].createdAt,
        messages: chatMessages,
        todos,
        transcript:
          input.include_transcript === true
            ? "Transcript data is not wired in this phase"
            : undefined,
      },
      null,
      2,
    );
  },
};
