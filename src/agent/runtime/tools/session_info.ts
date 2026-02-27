import { asc, desc, eq } from "drizzle-orm";
import log from "electron-log";
import { z } from "zod";

import { db } from "@/db";
import { chats, messages } from "@/db/schema";

import type { NativeTool } from "../tool_interface";

const logger = log.scope("tool.session_info");

const parameters = z.object({
  session_id: z.string(),
});

type SessionInfoInput = z.infer<typeof parameters>;

function toChatId(sessionId: string): number {
  const chatId = Number(sessionId);
  if (!Number.isInteger(chatId) || chatId <= 0) {
    throw new Error(`Invalid session_id: ${sessionId}`);
  }
  return chatId;
}

export const sessionInfoTool: NativeTool<SessionInfoInput> = {
  id: "mcp_session_info",
  description: "Get metadata and statistics for a session",
  parameters,
  riskLevel: "safe",
  execute: async (input) => {
    const chatId = toChatId(input.session_id);

    const chat = await db
      .select({
        id: chats.id,
        appId: chats.appId,
        title: chats.title,
        createdAt: chats.createdAt,
      })
      .from(chats)
      .where(eq(chats.id, chatId))
      .limit(1);

    if (chat.length === 0) {
      throw new Error(`Session not found: ${input.session_id}`);
    }

    const firstMessage = await db
      .select({ createdAt: messages.createdAt })
      .from(messages)
      .where(eq(messages.chatId, chatId))
      .orderBy(asc(messages.createdAt))
      .limit(1);

    const lastMessage = await db
      .select({ createdAt: messages.createdAt })
      .from(messages)
      .where(eq(messages.chatId, chatId))
      .orderBy(desc(messages.createdAt))
      .limit(1);

    const messageCountRows = await db
      .select({ id: messages.id })
      .from(messages)
      .where(eq(messages.chatId, chatId));

    logger.debug("Fetched session info", {
      chatId,
      messageCount: messageCountRows.length,
    });

    return JSON.stringify(
      {
        session_id: String(chat[0].id),
        app_id: chat[0].appId,
        title: chat[0].title ?? "Untitled Chat",
        created_at: chat[0].createdAt,
        message_count: messageCountRows.length,
        first_message_at: firstMessage[0]?.createdAt ?? null,
        last_message_at: lastMessage[0]?.createdAt ?? null,
      },
      null,
      2,
    );
  },
};
