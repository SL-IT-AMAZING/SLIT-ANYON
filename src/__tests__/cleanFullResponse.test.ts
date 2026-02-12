import { cleanFullResponse } from "@/ipc/utils/cleanFullResponse";
import { describe, it, expect } from "vitest";

describe("cleanFullResponse", () => {
  it("should replace < characters in anyon-write attributes", () => {
    const input = `<anyon-write path="src/file.tsx" description="Testing <a> tags.">content</anyon-write>`;
    const expected = `<anyon-write path="src/file.tsx" description="Testing ＜a＞ tags.">content</anyon-write>`;

    const result = cleanFullResponse(input);
    expect(result).toBe(expected);
  });

  it("should replace < characters in multiple attributes", () => {
    const input = `<anyon-write path="src/<component>.tsx" description="Testing <div> tags.">content</anyon-write>`;
    const expected = `<anyon-write path="src/＜component＞.tsx" description="Testing ＜div＞ tags.">content</anyon-write>`;

    const result = cleanFullResponse(input);
    expect(result).toBe(expected);
  });

  it("should handle multiple nested HTML tags in a single attribute", () => {
    const input = `<anyon-write path="src/file.tsx" description="Testing <div> and <span> and <a> tags.">content</anyon-write>`;
    const expected = `<anyon-write path="src/file.tsx" description="Testing ＜div＞ and ＜span＞ and ＜a＞ tags.">content</anyon-write>`;

    const result = cleanFullResponse(input);
    expect(result).toBe(expected);
  });

  it("should handle complex example with mixed content", () => {
    const input = `
      BEFORE TAG
  <anyon-write path="src/pages/locations/neighborhoods/louisville/Highlands.tsx" description="Updating Highlands neighborhood page to use <a> tags.">
import React from 'react';
</anyon-write>
AFTER TAG
    `;

    const expected = `
      BEFORE TAG
  <anyon-write path="src/pages/locations/neighborhoods/louisville/Highlands.tsx" description="Updating Highlands neighborhood page to use ＜a＞ tags.">
import React from 'react';
</anyon-write>
AFTER TAG
    `;

    const result = cleanFullResponse(input);
    expect(result).toBe(expected);
  });

  it("should handle other anyon tag types", () => {
    const input = `<anyon-rename from="src/<old>.tsx" to="src/<new>.tsx"></anyon-rename>`;
    const expected = `<anyon-rename from="src/＜old＞.tsx" to="src/＜new＞.tsx"></anyon-rename>`;

    const result = cleanFullResponse(input);
    expect(result).toBe(expected);
  });

  it("should handle anyon-delete tags", () => {
    const input = `<anyon-delete path="src/<component>.tsx"></anyon-delete>`;
    const expected = `<anyon-delete path="src/＜component＞.tsx"></anyon-delete>`;

    const result = cleanFullResponse(input);
    expect(result).toBe(expected);
  });

  it("should not affect content outside anyon tags", () => {
    const input = `Some text with <regular> HTML tags. <anyon-write path="test.tsx" description="With <nested> tags.">content</anyon-write> More <html> here.`;
    const expected = `Some text with <regular> HTML tags. <anyon-write path="test.tsx" description="With ＜nested＞ tags.">content</anyon-write> More <html> here.`;

    const result = cleanFullResponse(input);
    expect(result).toBe(expected);
  });

  it("should handle empty attributes", () => {
    const input = `<anyon-write path="src/file.tsx">content</anyon-write>`;
    const expected = `<anyon-write path="src/file.tsx">content</anyon-write>`;

    const result = cleanFullResponse(input);
    expect(result).toBe(expected);
  });

  it("should handle attributes without < characters", () => {
    const input = `<anyon-write path="src/file.tsx" description="Normal description">content</anyon-write>`;
    const expected = `<anyon-write path="src/file.tsx" description="Normal description">content</anyon-write>`;

    const result = cleanFullResponse(input);
    expect(result).toBe(expected);
  });
});
