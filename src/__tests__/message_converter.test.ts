import type { ModelMessage } from "ai";

import {
  applyContextLimit,
  estimateTokens,
} from "@/agent/runtime/message_converter";
import { describe, expect, it, vi } from "vitest";

vi.mock("@/db", () => ({
  db: {
    query: {
      messages: {
        findMany: vi.fn(),
      },
    },
  },
}));

vi.mock("@/db/schema", () => ({
  messages: {
    chatId: "chatId",
    createdAt: "createdAt",
  },
}));

vi.mock("@/ipc/utils/ai_messages_utils", () => ({
  parseAiMessagesJson: vi.fn(),
}));

vi.mock("drizzle-orm", () => ({
  asc: vi.fn(),
  eq: vi.fn(),
}));

describe("message_converter", () => {
  it("estimateTokens counts string message content", () => {
    const messages: ModelMessage[] = [
      { role: "user", content: "hello" },
      { role: "assistant", content: "world!" },
    ];

    const expectedChars = "hello".length + "world!".length;
    expect(estimateTokens(messages)).toBe(Math.ceil(expectedChars / 4));
  });

  it("estimateTokens counts array message content", () => {
    const messages: ModelMessage[] = [
      {
        role: "assistant",
        content: [
          { type: "text", text: "first" },
          { type: "text", text: "second" },
        ],
      },
    ];

    expect(estimateTokens(messages)).toBe(
      Math.ceil(JSON.stringify(messages[0].content).length / 4),
    );
  });

  it("applyContextLimit returns all messages when under budget", () => {
    const messages: ModelMessage[] = [
      { role: "user", content: "a".repeat(10) },
      { role: "assistant", content: "b".repeat(10) },
      { role: "user", content: "c".repeat(10) },
      { role: "assistant", content: "d".repeat(10) },
      { role: "user", content: "e".repeat(10) },
    ];

    const result = applyContextLimit(messages, 200);
    expect(result).toBe(messages);
  });

  it("applyContextLimit truncates from oldest messages when over budget", () => {
    const messages: ModelMessage[] = [
      { role: "user", content: "first-message" },
      { role: "assistant", content: "old-1 ".repeat(60) },
      { role: "user", content: "old-2 ".repeat(60) },
      { role: "assistant", content: "old-3 ".repeat(60) },
      { role: "user", content: "tail-1" },
      { role: "assistant", content: "tail-2" },
    ];

    const result = applyContextLimit(messages, 80);

    expect(result[0]).toEqual(messages[0]);
    expect(result[1]).toEqual({
      role: "user",
      content:
        "[Earlier conversation messages have been truncated to fit context window]",
    });
    expect(result).not.toContainEqual(messages[1]);
  });

  it("applyContextLimit keeps first message and latest messages", () => {
    const messages: ModelMessage[] = [
      { role: "user", content: "first" },
      { role: "assistant", content: "old-a ".repeat(80) },
      { role: "user", content: "old-b ".repeat(80) },
      { role: "assistant", content: "old-c ".repeat(80) },
      { role: "user", content: "last-1" },
      { role: "assistant", content: "last-2" },
      { role: "user", content: "last-3" },
      { role: "assistant", content: "last-4" },
    ];

    const result = applyContextLimit(messages, 90);

    expect(result[0]).toEqual(messages[0]);
    expect(result).toContainEqual(messages[4]);
    expect(result).toContainEqual(messages[5]);
    expect(result).toContainEqual(messages[6]);
    expect(result).toContainEqual(messages[7]);
  });

  it("applyContextLimit returns all when there are 4 or fewer messages", () => {
    const messages: ModelMessage[] = [
      { role: "user", content: "u1" },
      { role: "assistant", content: "a1" },
      { role: "user", content: "u2" },
      { role: "assistant", content: "a2" },
    ];

    const result = applyContextLimit(messages, 10);
    expect(result).toBe(messages);
  });
});
