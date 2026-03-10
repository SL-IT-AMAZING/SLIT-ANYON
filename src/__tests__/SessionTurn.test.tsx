import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { SessionTurn } from "@/components/chat-v2/SessionTurn";
import type { PartVM } from "@/components/chat/renderModel";

describe("SessionTurn", () => {
  it("renders canonical reasoning parts after completion", () => {
    const parts: PartVM[] = [
      {
        id: "2:reasoning:0",
        kind: "reasoning",
        messageId: 2,
        order: 0,
        text: "**Planning** the change",
        visibleAfterCompletion: true,
      },
      {
        id: "2:text:0",
        kind: "text",
        messageId: 2,
        order: 1,
        text: "Done.",
      },
    ];

    render(
      <SessionTurn
        userMessage="hello"
        steps={[]}
        parts={parts}
        working={false}
        stepsExpanded
      />,
    );

    expect(screen.getByText("Planning")).toBeTruthy();
    expect(screen.getByText("Done.")).toBeTruthy();
  });

  it("groups adjacent context tool parts in the part-first path", () => {
    const parts: PartVM[] = [
      {
        id: "2:tool:read:0",
        kind: "tool",
        messageId: 2,
        order: 0,
        toolName: "read",
        statusToolName: "read",
        iconToolName: "read",
        title: "Read",
        subtitle: "foo.ts",
        content: <div>read content</div>,
        isRunning: false,
      },
      {
        id: "2:tool:grep:1",
        kind: "tool",
        messageId: 2,
        order: 1,
        toolName: "grep",
        statusToolName: "grep",
        iconToolName: "grep",
        title: "Grep",
        subtitle: "src/",
        content: <div>grep content</div>,
        isRunning: false,
      },
      {
        id: "2:text:0",
        kind: "text",
        messageId: 2,
        order: 2,
        text: "Done.",
      },
    ];

    render(
      <SessionTurn
        userMessage="hello"
        steps={[]}
        parts={parts}
        working={false}
        stepsExpanded
      />,
    );

    expect(screen.getByText("Gathered context")).toBeTruthy();
    expect(screen.getByText("1 read, 1 grep")).toBeTruthy();
  });

  it("shows a copy affordance for the last assistant text part", () => {
    const parts: PartVM[] = [
      {
        id: "2:text:0",
        kind: "text",
        messageId: 2,
        order: 0,
        text: "First.",
      },
      {
        id: "2:text:1",
        kind: "text",
        messageId: 2,
        order: 1,
        text: "Last.",
      },
    ];

    render(
      <SessionTurn userMessage="hello" steps={[]} parts={parts} working={false} />,
    );

    expect(screen.getByRole("button", { name: "Copy response" })).toBeTruthy();
  });
});
