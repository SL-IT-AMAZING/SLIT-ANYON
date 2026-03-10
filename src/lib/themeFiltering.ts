import type { ThemeTag } from "@/lib/color-utils";

export type ThemeGalleryFilter = "all" | "liked";

interface ThemeFilterInput {
  theme: {
    id: string;
    name: string;
  };
  themeTags: ThemeTag[];
  selectedFilter: ThemeGalleryFilter;
  selectedTags: ThemeTag[];
  searchQuery: string;
  likedThemeIds: ReadonlySet<string>;
}

export function shouldIncludeTheme({
  theme,
  themeTags,
  selectedFilter,
  selectedTags,
  searchQuery,
  likedThemeIds,
}: ThemeFilterInput): boolean {
  if (selectedFilter === "liked" && !likedThemeIds.has(theme.id)) {
    return false;
  }

  const trimmedQuery = searchQuery.trim().toLowerCase();
  if (trimmedQuery.length > 0 && !theme.name.toLowerCase().includes(trimmedQuery)) {
    return false;
  }

  if (
    selectedTags.length > 0 &&
    !selectedTags.some((tag) => themeTags.includes(tag))
  ) {
    return false;
  }

  return true;
}
