import type { Message } from "@/ipc/types";

export interface OptimisticStreamMessages {
  userMessage: Message;
  assistantMessage: Message;
}

export function createOptimisticStreamMessages({
  prompt,
  now,
  createId,
}: {
  prompt: string;
  now: Date;
  createId: () => number;
}): OptimisticStreamMessages {
  return {
    userMessage: {
      id: createId(),
      role: "user",
      content: prompt,
      createdAt: now,
    },
    assistantMessage: {
      id: createId(),
      role: "assistant",
      content: "",
      createdAt: now,
    },
  };
}

export function appendOptimisticStreamMessages(
  existingMessages: Message[],
  optimisticMessages: OptimisticStreamMessages,
): Message[] {
  return [
    ...existingMessages,
    optimisticMessages.userMessage,
    optimisticMessages.assistantMessage,
  ];
}

export function removeOptimisticStreamMessages(
  existingMessages: Message[],
  optimisticMessages: OptimisticStreamMessages,
): Message[] {
  const optimisticIds = new Set([
    optimisticMessages.userMessage.id,
    optimisticMessages.assistantMessage.id,
  ]);

  return existingMessages.filter((message) => !optimisticIds.has(message.id));
}
