import type { ModelMessage } from "ai";

import { db } from "@/db";
import { messages as messagesTable } from "@/db/schema";
import {
  type DbMessageForParsing,
  parseAiMessagesJson,
} from "@/ipc/utils/ai_messages_utils";
import { asc, eq } from "drizzle-orm";

export async function loadChatMessages(
  chatId: number,
): Promise<ModelMessage[]> {
  const dbMessages = await db.query.messages.findMany({
    where: eq(messagesTable.chatId, chatId),
    orderBy: [asc(messagesTable.createdAt)],
  });

  const result: ModelMessage[] = [];
  for (const msg of dbMessages) {
    const parsed = parseAiMessagesJson(msg as DbMessageForParsing);
    result.push(...parsed);
  }

  return result;
}

export function estimateTokens(messages: ModelMessage[]): number {
  let chars = 0;
  for (const msg of messages) {
    if (typeof msg.content === "string") {
      chars += msg.content.length;
    } else if (Array.isArray(msg.content)) {
      chars += JSON.stringify(msg.content).length;
    }
  }
  return Math.ceil(chars / 4);
}

export function applyContextLimit(
  messages: ModelMessage[],
  contextWindowTokens: number,
): ModelMessage[] {
  const budget = Math.floor(contextWindowTokens * 0.7);

  if (estimateTokens(messages) <= budget || messages.length <= 4) {
    return messages;
  }

  const first = messages.slice(0, 1);
  const keepLast = Math.min(4, messages.length - 1);
  const last = messages.slice(-keepLast);

  const truncationMarker: ModelMessage = {
    role: "user",
    content:
      "[Earlier conversation messages have been truncated to fit context window]",
  };

  let middle = messages.slice(1, messages.length - keepLast);
  while (middle.length > 0) {
    const candidate = [...first, truncationMarker, ...middle, ...last];
    if (estimateTokens(candidate) <= budget) {
      return candidate;
    }
    middle = middle.slice(1);
  }

  return [...first, truncationMarker, ...last];
}
