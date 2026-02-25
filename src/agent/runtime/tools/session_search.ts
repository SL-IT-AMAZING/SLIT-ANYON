import { and, asc, eq, like, sql } from "drizzle-orm";
import log from "electron-log";
import { z } from "zod";

import { db } from "@/db";
import { chats, messages } from "@/db/schema";

import type { NativeTool } from "../tool_interface";

const logger = log.scope("tool.session_search");

const parameters = z.object({
  query: z.string(),
  session_id: z.string().optional(),
  case_sensitive: z.boolean().optional(),
  limit: z.number().optional(),
});

type SessionSearchInput = z.infer<typeof parameters>;

function toChatId(sessionId: string): number {
  const chatId = Number(sessionId);
  if (!Number.isInteger(chatId) || chatId <= 0) {
    throw new Error(`Invalid session_id: ${sessionId}`);
  }
  return chatId;
}

export const sessionSearchTool: NativeTool<SessionSearchInput> = {
  id: "mcp_session_search",
  description: "Search session messages for matching content",
  parameters,
  riskLevel: "safe",
  execute: async (input) => {
    const rowLimit = Math.max(1, Math.min(input.limit ?? 20, 200));
    const pattern = `%${input.query}%`;

    const contentFilter = input.case_sensitive
      ? sql`${messages.content} GLOB ${`*${input.query}*`}`
      : like(messages.content, pattern);

    const chatFilter = input.session_id
      ? eq(messages.chatId, toChatId(input.session_id))
      : undefined;

    const rows = await db
      .select({
        messageId: messages.id,
        sessionId: messages.chatId,
        role: messages.role,
        content: messages.content,
        createdAt: messages.createdAt,
        title: chats.title,
      })
      .from(messages)
      .innerJoin(chats, eq(messages.chatId, chats.id))
      .where(and(contentFilter, chatFilter))
      .orderBy(asc(messages.createdAt))
      .limit(rowLimit);

    logger.debug("Searched sessions", {
      queryLength: input.query.length,
      matches: rows.length,
      caseSensitive: Boolean(input.case_sensitive),
    });

    return JSON.stringify(
      {
        total: rows.length,
        results: rows.map((row) => ({
          message_id: row.messageId,
          session_id: String(row.sessionId),
          session_title: row.title ?? "Untitled Chat",
          role: row.role,
          content: row.content,
          created_at: row.createdAt,
        })),
      },
      null,
      2,
    );
  },
};
