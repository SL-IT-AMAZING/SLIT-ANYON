import {
  findLastIndexByRole,
  findLastMessageByRole,
  findPreviousAssistantWithCommitBefore,
  findPreviousMessageByRole,
} from "@/components/chat/messagesListUtils";
import type { Message } from "@/ipc/types";
import { describe, expect, it } from "vitest";

function createMessage(
  id: number,
  role: "user" | "assistant",
  overrides: Partial<Message> = {},
): Message {
  return {
    id,
    role,
    content: `${role}-${id}`,
    ...overrides,
  } as Message;
}

describe("messagesListUtils", () => {
  it("finds the last index for a role", () => {
    const messages = [
      createMessage(1, "user"),
      createMessage(2, "assistant"),
      createMessage(3, "assistant"),
    ];

    expect(findLastIndexByRole(messages, "assistant")).toBe(2);
    expect(findLastIndexByRole(messages, "user")).toBe(0);
  });

  it("returns -1 when role does not exist", () => {
    const messages = [createMessage(1, "assistant")];
    expect(findLastIndexByRole(messages, "user")).toBe(-1);
  });

  it("finds previous message by role before index", () => {
    const messages = [
      createMessage(1, "user"),
      createMessage(2, "assistant"),
      createMessage(3, "assistant"),
      createMessage(4, "user"),
      createMessage(5, "assistant"),
    ];

    const previousUser = findPreviousMessageByRole(messages, 4, "user");
    expect(previousUser?.id).toBe(4);
  });

  it("finds previous committed assistant before a user turn", () => {
    const messages = [
      createMessage(1, "user"),
      createMessage(2, "assistant", { commitHash: "c1" }),
      createMessage(3, "assistant"),
      createMessage(4, "user"),
      createMessage(5, "assistant", { commitHash: "c2" }),
      createMessage(6, "assistant"),
      createMessage(7, "assistant", { commitHash: "c3" }),
    ];

    const lastUserIndex = findLastIndexByRole(messages, "user");
    expect(lastUserIndex).toBe(3);

    const previousAssistant =
      lastUserIndex >= 0
        ? findPreviousAssistantWithCommitBefore(messages, lastUserIndex)
        : undefined;

    expect(previousAssistant?.id).toBe(2);
    expect(previousAssistant?.commitHash).toBe("c1");
  });

  it("finds last user message regardless of trailing assistants", () => {
    const messages = [
      createMessage(1, "user"),
      createMessage(2, "assistant"),
      createMessage(3, "assistant"),
      createMessage(4, "user"),
      createMessage(5, "assistant"),
      createMessage(6, "assistant"),
    ];

    const lastUser = findLastMessageByRole(messages, "user");
    expect(lastUser?.id).toBe(4);
  });
});
