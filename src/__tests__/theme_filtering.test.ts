import { shouldIncludeTheme } from "@/lib/themeFiltering";
import { describe, expect, it } from "vitest";

describe("themeFiltering", () => {
  const baseTheme = {
    id: "sage-green",
    name: "Sage Green",
  };

  it("hides unliked themes when selected filter is liked", () => {
    expect(
      shouldIncludeTheme({
        theme: baseTheme,
        themeTags: ["light", "minimal"],
        selectedFilter: "liked",
        selectedTags: [],
        searchQuery: "",
        likedThemeIds: new Set(),
      }),
    ).toBe(false);
  });

  it("shows liked themes when selected filter is liked", () => {
    expect(
      shouldIncludeTheme({
        theme: baseTheme,
        themeTags: ["light", "minimal"],
        selectedFilter: "liked",
        selectedTags: [],
        searchQuery: "",
        likedThemeIds: new Set(["sage-green"]),
      }),
    ).toBe(true);
  });

  it("applies search and tag filters together", () => {
    expect(
      shouldIncludeTheme({
        theme: baseTheme,
        themeTags: ["light", "minimal"],
        selectedFilter: "all",
        selectedTags: ["minimal"],
        searchQuery: "sage",
        likedThemeIds: new Set(),
      }),
    ).toBe(true);

    expect(
      shouldIncludeTheme({
        theme: baseTheme,
        themeTags: ["light", "minimal"],
        selectedFilter: "all",
        selectedTags: ["playful"],
        searchQuery: "sage",
        likedThemeIds: new Set(),
      }),
    ).toBe(false);
  });
});
