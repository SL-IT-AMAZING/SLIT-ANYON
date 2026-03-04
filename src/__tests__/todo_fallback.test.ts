import { extractLatestTodosFromAssistantMessage } from "@/components/chat/todoFallback";
import { describe, expect, it } from "vitest";

describe("todoFallback", () => {
  it("extracts todos from latest todowrite opencode-tool payload", () => {
    const content = [
      '<opencode-tool name="read" status="completed">done</opencode-tool>',
      '<opencode-tool name="todowrite" status="completed">',
      JSON.stringify({
        metadata: {
          todos: [
            { id: "1", content: "First", status: "completed" },
            { id: "2", content: "Second", status: "in_progress" },
          ],
        },
      }),
      "</opencode-tool>",
    ].join("\n");

    expect(extractLatestTodosFromAssistantMessage(content)).toEqual([
      { id: "1", content: "First", status: "completed" },
      { id: "2", content: "Second", status: "in_progress" },
    ]);
  });

  it("falls back to fenced json and normalizes invalid rows", () => {
    const content = [
      '<opencode-tool name="todowrite" status="completed">',
      "```json",
      JSON.stringify({
        todos: [
          { content: "Pending item", status: "pending" },
          { content: "Bad status", status: "unknown" },
          { content: "" },
        ],
      }),
      "```",
      "</opencode-tool>",
    ].join("\n");

    expect(extractLatestTodosFromAssistantMessage(content)).toEqual([
      { id: "todo-0-Pending item", content: "Pending item", status: "pending" },
      { id: "todo-1-Bad status", content: "Bad status", status: "pending" },
    ]);
  });

  it("returns null when no todo tool payload exists", () => {
    const content =
      '<opencode-tool name="read" status="completed">ok</opencode-tool>';
    expect(extractLatestTodosFromAssistantMessage(content)).toBeNull();
  });
});
