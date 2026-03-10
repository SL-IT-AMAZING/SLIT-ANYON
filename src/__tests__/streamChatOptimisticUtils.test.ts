import {
  appendOptimisticStreamMessages,
  createOptimisticStreamMessages,
  removeOptimisticStreamMessages,
} from "@/hooks/streamChatOptimisticUtils";
import type { Message } from "@/ipc/types";
import { describe, expect, it } from "vitest";

describe("streamChatOptimisticUtils", () => {
  it("creates immediate user and assistant placeholder messages", () => {
    let nextId = 100;
    const optimistic = createOptimisticStreamMessages({
      prompt: "Update the selected component",
      now: new Date("2026-03-10T03:00:00.000Z"),
      createId: () => nextId++,
    });

    expect(optimistic.userMessage).toMatchObject({
      id: 100,
      role: "user",
      content: "Update the selected component",
    });
    expect(optimistic.assistantMessage).toMatchObject({
      id: 101,
      role: "assistant",
      content: "",
    });
  });

  it("appends optimistic messages as a new turn", () => {
    const existingMessages: Message[] = [
      {
        id: 1,
        role: "user",
        content: "Previous prompt",
      },
    ];
    const optimistic = createOptimisticStreamMessages({
      prompt: "New prompt",
      now: new Date("2026-03-10T03:00:00.000Z"),
      createId: () => 2,
    });

    const appended = appendOptimisticStreamMessages(
      existingMessages,
      optimistic,
    );

    expect(appended.map((message) => message.role)).toEqual([
      "user",
      "user",
      "assistant",
    ]);
  });

  it("removes only the optimistic messages during rollback", () => {
    const now = new Date("2026-03-10T03:00:00.000Z");
    let nextId = 10;
    const optimistic = createOptimisticStreamMessages({
      prompt: "Prompt",
      now,
      createId: () => nextId++,
    });
    const existingMessages: Message[] = [
      { id: 1, role: "user", content: "Earlier" },
      optimistic.userMessage,
      optimistic.assistantMessage,
      { id: 99, role: "assistant", content: "Later real message" },
    ];

    const rolledBack = removeOptimisticStreamMessages(
      existingMessages,
      optimistic,
    );

    expect(rolledBack.map((message) => message.id)).toEqual([1, 99]);
  });
});
