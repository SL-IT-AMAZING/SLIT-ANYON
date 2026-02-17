import type { Message } from "@/ipc/types";

export function findLastIndexByRole(
  messages: Message[],
  role: Message["role"],
): number {
  for (let index = messages.length - 1; index >= 0; index -= 1) {
    if (messages[index].role === role) {
      return index;
    }
  }

  return -1;
}

export function findPreviousMessageByRole(
  messages: Message[],
  beforeIndex: number,
  role: Message["role"],
): Message | undefined {
  for (let index = beforeIndex - 1; index >= 0; index -= 1) {
    if (messages[index].role === role) {
      return messages[index];
    }
  }

  return undefined;
}

export function findLastMessageByRole(
  messages: Message[],
  role: Message["role"],
): Message | undefined {
  const index = findLastIndexByRole(messages, role);
  return index >= 0 ? messages[index] : undefined;
}

export function findPreviousAssistantWithCommitBefore(
  messages: Message[],
  beforeIndex: number,
): Message | undefined {
  for (let index = beforeIndex - 1; index >= 0; index -= 1) {
    const message = messages[index];
    if (message.role === "assistant" && message.commitHash) {
      return message;
    }
  }

  return undefined;
}
