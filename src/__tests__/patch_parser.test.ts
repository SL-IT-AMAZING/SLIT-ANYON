import { describe, expect, it } from "vitest";

import {
  BlockAnchorReplacer,
  ContextAwareReplacer,
  EscapeNormalizedReplacer,
  IndentationFlexibleReplacer,
  LineTrimmedReplacer,
  MultiOccurrenceReplacer,
  SimpleReplacer,
  TrimmedBoundaryReplacer,
  WhitespaceNormalizedReplacer,
  replace,
} from "@/agent/runtime/tools/edit";

function collectMatches(
  replacer: (content: string, find: string) => Generator<string, void, unknown>,
  content: string,
  find: string,
): string[] {
  return Array.from(replacer(content, find));
}

describe("edit replacers", () => {
  it("SimpleReplacer yields exact find string", () => {
    const matches = collectMatches(SimpleReplacer, "alpha beta", "beta");
    expect(matches).toEqual(["beta"]);
  });

  it("SimpleReplacer handles empty find string edge case", () => {
    const matches = collectMatches(SimpleReplacer, "alpha beta", "");
    expect(matches).toEqual([""]);
  });

  it("LineTrimmedReplacer matches lines with whitespace differences", () => {
    const content = "const a = 1;\n  return a;\n}";
    const find = " const a = 1;\nreturn a;\n";

    const matches = collectMatches(LineTrimmedReplacer, content, find);
    expect(matches).toEqual(["const a = 1;\n  return a;"]);
  });

  it("BlockAnchorReplacer matches exact multi-line anchored block", () => {
    const content = "start\n  body line\nend\ntrailer";
    const find = "start\nbody line\nend";

    const matches = collectMatches(BlockAnchorReplacer, content, find);
    expect(matches).toEqual(["start\n  body line\nend"]);
  });

  it("BlockAnchorReplacer picks best fuzzy candidate among multiple blocks", () => {
    const content =
      "start\nalpha one\nend\nseparator\nstart\nbeta target\nend\nfooter";
    const find = "start\nbeta targit\nend";

    const matches = collectMatches(BlockAnchorReplacer, content, find);
    expect(matches).toEqual(["start\nbeta target\nend"]);
  });

  it("WhitespaceNormalizedReplacer finds match with normalized whitespace", () => {
    const content = "const value = alpha   +\tbeta;";
    const find = "alpha + beta";

    const matches = collectMatches(WhitespaceNormalizedReplacer, content, find);
    expect(matches).toContain("alpha   +\tbeta");
  });

  it("IndentationFlexibleReplacer matches block with different indentation", () => {
    const content = "prefix\n    if (ok) {\n      run();\n    }\nsuffix";
    const find = "if (ok) {\n  run();\n}";

    const matches = collectMatches(IndentationFlexibleReplacer, content, find);
    expect(matches).toEqual(["    if (ok) {\n      run();\n    }"]);
  });

  it("EscapeNormalizedReplacer matches escaped newlines against content", () => {
    const content = "line one\nline two\nline three";
    const find = "line one\\nline two";

    const matches = collectMatches(EscapeNormalizedReplacer, content, find);
    expect(matches).toContain("line one\nline two");
  });

  it("TrimmedBoundaryReplacer matches after trimming boundary whitespace", () => {
    const content = "prefix\nvalue to match\nsuffix";
    const find = "  value to match   ";

    const matches = collectMatches(TrimmedBoundaryReplacer, content, find);
    expect(matches).toEqual(["value to match", "value to match"]);
  });

  it("ContextAwareReplacer matches by first/last line and inner similarity", () => {
    const content = "before\nstart\none\ntwo\nend\nafter";
    const find = "start\none\nTHREE\nend";

    const matches = collectMatches(ContextAwareReplacer, content, find);
    expect(matches).toEqual(["start\none\ntwo\nend"]);
  });

  it("MultiOccurrenceReplacer yields all occurrences", () => {
    const content = "token middle token end token";
    const matches = collectMatches(MultiOccurrenceReplacer, content, "token");
    expect(matches).toEqual(["token", "token", "token"]);
  });
});

describe("replace", () => {
  it("replaces a unique exact match", () => {
    const updated = replace("a\nb\nc", "b", "B");
    expect(updated).toBe("a\nB\nc");
  });

  it("replaces all occurrences when replaceAll is true", () => {
    const updated = replace("dog cat dog", "dog", "wolf", true);
    expect(updated).toBe("wolf cat wolf");
  });

  it("supports fuzzy replacement via line-trimmed matching", () => {
    const content = "function x() {\n  return 1;\n}";
    const updated = replace(
      content,
      "function x() {\nreturn 1;\n}",
      "function x() {\n  return 2;\n}",
    );
    expect(updated).toBe("function x() {\n  return 2;\n}");
  });

  it("throws when oldString cannot be found", () => {
    expect(() => replace("abc", "zzz", "x")).toThrow(
      "oldString not found in content",
    );
  });

  it("throws when multiple candidates exist for single replacement", () => {
    expect(() => replace("x\n...\nx", "x", "y")).toThrow(
      "Found multiple matches for oldString. Provide more surrounding lines in oldString to identify the correct match.",
    );
  });
});
