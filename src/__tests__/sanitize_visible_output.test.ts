import { describe, expect, it } from "vitest";
import { sanitizeVisibleOutput } from "../../shared/sanitizeVisibleOutput";

describe("sanitizeVisibleOutput", () => {
  it("removes prompt submit hook blocks and analysis markers", () => {
    const raw = [
      "Before",
      "<user-prompt-submit-hook>",
      "internal details",
      "</user-prompt-submit-hook>",
      "[analyze-mode]",
      "After",
    ].join("\n");

    const sanitized = sanitizeVisibleOutput(raw);
    expect(sanitized).toContain("Before");
    expect(sanitized).toContain("After");
    expect(sanitized).not.toContain("user-prompt-submit-hook");
    expect(sanitized).not.toContain("[analyze-mode]");
  });

  it("removes TODO continuation system directive blocks", () => {
    const raw = [
      "Normal line",
      "[SYSTEM DIRECTIVE: OH-MY-OPENCODE - TODO CONTINUATION]",
      "",
      "Incomplete tasks remain in your todo list. Continue working on the next pending task.",
      "",
      "- Proceed without asking for permission",
      "- Mark each task complete when finished",
      "- Do not stop until all tasks are done",
      "",
      "[Status: 0/4 completed, 4 remaining]",
      "",
      "Remaining tasks:",
      "- [pending] one",
      "- [pending] two",
      "",
      "Visible line",
    ].join("\n");

    const sanitized = sanitizeVisibleOutput(raw);
    expect(sanitized).toContain("Normal line");
    expect(sanitized).toContain("Visible line");
    expect(sanitized).not.toContain("SYSTEM DIRECTIVE");
    expect(sanitized).not.toContain("Remaining tasks:");
  });
});
