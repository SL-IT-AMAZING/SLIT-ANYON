import {
  getVisualEditingResponseKey,
  hasVisualEditingStyleChanges,
  mergeVisualEditingTextContent,
  reconcileVisualEditingTextChange,
  shouldRefreshLiveTextContent,
} from "@/components/preview_panel/visualEditingSaveUtils";
import type { VisualEditingChange } from "@/ipc/types";
import { describe, expect, it } from "vitest";

function createChange(
  overrides: Partial<VisualEditingChange> = {},
): VisualEditingChange {
  return {
    componentId: "src/pages/Index.tsx:12:4",
    componentName: "Heading",
    relativePath: "src/pages/Index.tsx",
    lineNumber: 12,
    styles: {},
    ...overrides,
  };
}

describe("visualEditingSaveUtils", () => {
  it("uses runtimeId when building response keys", () => {
    expect(
      getVisualEditingResponseKey(
        createChange({ runtimeId: "runtime-1", componentId: "a:1:1" }),
      ),
    ).toBe("a:1:1::runtime-1");
    expect(
      getVisualEditingResponseKey(createChange({ componentId: "a:1:1" })),
    ).toBe("a:1:1");
  });

  it("only requests live text refresh for actual text edits", () => {
    expect(shouldRefreshLiveTextContent(createChange())).toBe(false);
    expect(
      shouldRefreshLiveTextContent(createChange({ textContent: "Edited" })),
    ).toBe(true);
    expect(
      shouldRefreshLiveTextContent(createChange({ textContent: "" })),
    ).toBe(true);
  });

  it("merges cached text using the runtime-aware response key", () => {
    const unchanged = createChange({ componentId: "src/pages/Index.tsx:24:2" });
    const edited = createChange({
      componentId: "src/pages/Index.tsx:12:4",
      runtimeId: "runtime-1",
      textContent: "Draft text",
    });

    const merged = mergeVisualEditingTextContent(
      [unchanged, edited],
      new Map([["src/pages/Index.tsx:12:4::runtime-1", "Fresh text"]]),
    );

    expect(merged[0]).toEqual(unchanged);
    expect(merged[1]?.textContent).toBe("Fresh text");
  });

  it("preserves the last locally tracked text when no response arrives", () => {
    const edited = createChange({
      componentId: "src/pages/Index.tsx:12:4",
      runtimeId: "runtime-1",
      textContent: "Draft text",
    });

    const merged = mergeVisualEditingTextContent([edited], new Map());

    expect(merged[0]?.textContent).toBe("Draft text");
  });

  it("detects when a change only contains empty style objects", () => {
    expect(hasVisualEditingStyleChanges(createChange({ styles: {} }))).toBe(
      false,
    );
    expect(
      hasVisualEditingStyleChanges(
        createChange({ styles: { text: { color: "#fff" } } }),
      ),
    ).toBe(true);
  });

  it("drops unchanged text-only updates", () => {
    const nextChange = reconcileVisualEditingTextChange({
      componentId: "src/pages/Index.tsx:12:4",
      componentName: "Heading",
      relativePath: "src/pages/Index.tsx",
      lineNumber: 12,
      text: "Original text",
      originalText: "Original text",
    });

    expect(nextChange).toBeNull();
  });

  it("preserves style changes when text returns to its original value", () => {
    const nextChange = reconcileVisualEditingTextChange({
      existingChange: createChange({
        runtimeId: "runtime-1",
        styles: { text: { color: "#fff" } },
        textContent: "Edited text",
      }),
      componentId: "src/pages/Index.tsx:12:4",
      componentName: "Heading",
      runtimeId: "runtime-1",
      relativePath: "src/pages/Index.tsx",
      lineNumber: 12,
      text: "Original text",
      originalText: "Original text",
    });

    expect(nextChange).not.toBeNull();
    expect(nextChange?.styles).toEqual({ text: { color: "#fff" } });
    expect(nextChange?.textContent).toBeUndefined();
  });

  it("stores text changes when the content actually changed", () => {
    const nextChange = reconcileVisualEditingTextChange({
      componentId: "src/pages/Index.tsx:12:4",
      componentName: "Heading",
      runtimeId: "runtime-1",
      relativePath: "src/pages/Index.tsx",
      lineNumber: 12,
      text: "Edited text",
      originalText: "Original text",
    });

    expect(nextChange).toMatchObject({
      componentId: "src/pages/Index.tsx:12:4",
      runtimeId: "runtime-1",
      textContent: "Edited text",
    });
  });
});
