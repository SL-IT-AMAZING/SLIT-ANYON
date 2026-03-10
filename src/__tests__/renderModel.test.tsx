import type { Message } from "@/ipc/types";
import { describe, expect, it } from "vitest";

import {
  type MessageTurn,
  buildTurnVM,
  buildTurnVMs,
  groupMessagesIntoTurns,
  summarizeTurnFromVM,
} from "@/components/chat/renderModel";

function createMessage(
  id: number,
  role: "user" | "assistant",
  content: string,
  overrides: Partial<Message> = {},
): Message {
  return {
    id,
    role,
    content,
    createdAt: "2026-03-10T00:00:00.000Z",
    ...overrides,
  } as Message;
}

function createTurn(messages: Message[]): MessageTurn {
  return groupMessagesIntoTurns(messages)[0]!;
}

describe("renderModel", () => {
  it("groups messages into user-led turns", () => {
    const messages = [
      createMessage(1, "user", "first"),
      createMessage(2, "assistant", "one"),
      createMessage(3, "assistant", "two"),
      createMessage(4, "user", "second"),
      createMessage(5, "assistant", "three"),
    ];

    const turns = groupMessagesIntoTurns(messages);

    expect(turns).toHaveLength(2);
    expect(turns[0]?.userMessage?.id).toBe(1);
    expect(turns[0]?.assistantMessages.map((message) => message.id)).toEqual([2, 3]);
    expect(turns[1]?.userMessage?.id).toBe(4);
    expect(turns[1]?.assistantMessages.map((message) => message.id)).toEqual([5]);
  });

  it("keeps reasoning as a canonical part after stream completion", () => {
    const turn = createTurn([
      createMessage(1, "user", "hello"),
      createMessage(2, "assistant", '<think>Plan it carefully</think>\nDone.'),
    ]);

    const vm = buildTurnVM(turn, false);

    expect(vm.parts.map((part) => part.kind)).toEqual(["reasoning", "text"]);
    expect(vm.parts[0]?.id).toBe("2:reasoning:0");
  });

  it("uses stable tool ids from opencode toolid across streaming chunks", () => {
    const firstTurn = createTurn([
      createMessage(1, "user", "hello"),
      createMessage(
        2,
        "assistant",
        '<opencode-tool name="read" toolid="tool-1" status="running"></opencode-tool>',
      ),
    ]);
    const secondTurn = createTurn([
      createMessage(1, "user", "hello"),
      createMessage(
        2,
        "assistant",
        '<opencode-tool name="read" toolid="tool-1" status="completed">done</opencode-tool>\nFinished.',
      ),
    ]);

    const firstVm = buildTurnVM(firstTurn, true);
    const secondVm = buildTurnVM(secondTurn, true);

    const firstTool = firstVm.parts.find((part) => part.kind === "tool");
    const secondTool = secondVm.parts.find((part) => part.kind === "tool");

    expect(firstTool?.id).toBe("2:tool:tool-1:0");
    expect(secondTool?.id).toBe(firstTool?.id);
  });

  it("preserves legacy reasoning visibility behavior in summarized turn output", () => {
    const turn = createTurn([
      createMessage(1, "user", "hello"),
      createMessage(2, "assistant", '<think>Plan it carefully</think>\nDone.'),
    ]);
    const vm = buildTurnVM(turn, false);

    const summary = summarizeTurnFromVM(vm, false, Date.now());

    expect(summary.steps.map((step) => step.type)).toEqual(["reasoning", "text"]);
  });

  it("uses the latest reasoning heading as fallback working status text", () => {
    const turn = createTurn([
      createMessage(1, "user", "hello"),
      createMessage(
        2,
        "assistant",
        "<think>## Inspecting files\nNeed more context</think>",
      ),
    ]);
    const vm = buildTurnVM(turn, true);

    const summary = summarizeTurnFromVM(vm, true, Date.now());

    expect(summary.statusText).toBe("Inspecting files");
  });

  it("builds canonical turn VMs for only the active streaming turn", () => {
    const turns = buildTurnVMs(
      [
        createMessage(1, "user", "first"),
        createMessage(2, "assistant", '<opencode-tool name="read" toolid="t-1" status="completed">x</opencode-tool>'),
        createMessage(3, "user", "second"),
        createMessage(4, "assistant", '<opencode-tool name="read" toolid="t-2" status="running"></opencode-tool>'),
      ],
      true,
    );

    const firstTool = turns[0]?.parts.find((part) => part.kind === "tool");
    const secondTool = turns[1]?.parts.find((part) => part.kind === "tool");

    expect(firstTool && "isRunning" in firstTool ? firstTool.isRunning : undefined).toBe(false);
    expect(secondTool && "isRunning" in secondTool ? secondTool.isRunning : undefined).toBe(true);
  });
});
