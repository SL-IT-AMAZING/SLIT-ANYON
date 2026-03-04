import { useDesignSystems } from "@/hooks/useDesignSystems";
import { useTweakcnThemes } from "@/hooks/useTweakcnThemes";
import type { TweakcnThemeType } from "@/ipc/types";
import type { DesignSystemType } from "@/ipc/types/design_systems";
import type { ThemeTag } from "@/lib/color-utils";
import { generateThemeTags } from "@/lib/color-utils";
import { cn } from "@/lib/utils";
import { Loader2, PackageOpen, Search } from "lucide-react";
import type React from "react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { DesignSystemCard } from "./DesignSystemCard";
import type { LibraryFilter } from "./LibraryList";
import { TweakcnThemeCard, TweakcnThemeCardSkeleton } from "./TweakcnThemeCard";
import { Input } from "./ui/input";

export type SortOption = "popular" | "newest" | "oldest";

const PAGE_SIZE = 20;

interface DesignSystemGalleryProps {
  onPreview: (id: string) => void;
  onUse: (id: string) => void;
  selectedFilter?: LibraryFilter;
  selectedTags?: ThemeTag[];
  sortOption?: SortOption;
  onSortChange?: (sort: SortOption) => void;
  searchQuery?: string;
  onSearchChange?: (query: string) => void;
}

export const DesignSystemGallery: React.FC<DesignSystemGalleryProps> = ({
  onPreview,
  onUse,
  selectedFilter = "all",
  selectedTags = [],
  sortOption = "popular",
  onSortChange,
  searchQuery = "",
  onSearchChange,
}) => {
  const { designSystems, isLoading } = useDesignSystems();
  const { themes, isLoading: isThemesLoading } = useTweakcnThemes();
  const [displayCount, setDisplayCount] = useState(PAGE_SIZE);
  const sentinelRef = useRef<HTMLDivElement>(null);
  const filterFingerprint = `${searchQuery}|${selectedFilter}|${selectedTags.join(",")}|${sortOption}`;
  const lastFingerprintRef = useRef(filterFingerprint);

  const themeTagsMap = useMemo(() => {
    const map = new Map<string, ThemeTag[]>();
    for (const theme of themes) {
      map.set(theme.id, generateThemeTags(theme.cssVars.light));
    }
    return map;
  }, [themes]);

  const filteredDesignSystems = useMemo(() => {
    if (selectedFilter === "design-systems" || selectedFilter === "all") {
      return designSystems.filter((ds: DesignSystemType) => {
        const query = searchQuery.toLowerCase();
        return (
          !searchQuery ||
          ds.displayName.toLowerCase().includes(query) ||
          ds.description.toLowerCase().includes(query) ||
          ds.tags.some((tag) => tag.toLowerCase().includes(query))
        );
      });
    }
    return [];
  }, [designSystems, selectedFilter, searchQuery]);

  const filteredThemes = useMemo(() => {
    if (selectedFilter === "design-systems") return [];

    return themes.filter((theme: TweakcnThemeType) => {
      const query = searchQuery.toLowerCase();
      const matchesSearch =
        !searchQuery || theme.name.toLowerCase().includes(query);

      const themeTags = themeTagsMap.get(theme.id) ?? [];
      const matchesTags =
        selectedTags.length === 0 ||
        selectedTags.some((tag) => themeTags.includes(tag));

      return matchesSearch && matchesTags;
    });
  }, [themes, searchQuery, selectedTags, themeTagsMap, selectedFilter]);

  const sortedThemes = useMemo(() => {
    const sorted = [...filteredThemes];
    if (sortOption === "newest") sorted.reverse();
    return sorted;
  }, [filteredThemes, sortOption]);

  const totalItems = filteredDesignSystems.length + sortedThemes.length;

  const { visibleDesignSystems, visibleThemes } = useMemo(() => {
    const dsSlice = filteredDesignSystems.slice(
      0,
      Math.min(filteredDesignSystems.length, displayCount),
    );
    const remaining = displayCount - dsSlice.length;
    const themeSlice = remaining > 0 ? sortedThemes.slice(0, remaining) : [];
    return { visibleDesignSystems: dsSlice, visibleThemes: themeSlice };
  }, [filteredDesignSystems, sortedThemes, displayCount]);

  const hasMore =
    visibleDesignSystems.length + visibleThemes.length < totalItems;

  const loadMore = useCallback(() => {
    setDisplayCount((prev) => prev + PAGE_SIZE);
  }, []);

  if (lastFingerprintRef.current !== filterFingerprint) {
    lastFingerprintRef.current = filterFingerprint;
    setDisplayCount(PAGE_SIZE);
  }

  useEffect(() => {
    const sentinel = sentinelRef.current;
    if (!sentinel) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting && hasMore) {
          loadMore();
        }
      },
      { rootMargin: "200px" },
    );

    observer.observe(sentinel);
    return () => observer.disconnect();
  }, [hasMore, loadMore]);

  const isAnyLoading = isLoading || isThemesLoading;
  const hasAnyResults =
    visibleDesignSystems.length > 0 || visibleThemes.length > 0;

  return (
    <section data-testid="design-system-gallery">
      <div className="relative mb-5">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search themes and design systems..."
          value={searchQuery}
          onChange={(e) => onSearchChange?.(e.target.value)}
          className="pl-10 w-full"
        />
      </div>

      <div className="flex items-center justify-between mb-5">
        <div className="flex items-center gap-1 text-sm">
          {(["popular", "newest", "oldest"] as const).map((opt, i) => (
            <span key={opt} className="flex items-center">
              {i > 0 && (
                <span className="text-muted-foreground/40 mx-1.5">
                  &middot;
                </span>
              )}
              <button
                type="button"
                onClick={() => onSortChange?.(opt)}
                className={cn(
                  "capitalize transition-colors cursor-pointer",
                  sortOption === opt
                    ? "font-semibold text-foreground"
                    : "text-muted-foreground hover:text-foreground",
                )}
              >
                {opt}
              </button>
            </span>
          ))}
        </div>
        <span className="text-sm text-muted-foreground">
          Showing {totalItems} {totalItems === 1 ? "theme" : "themes"}
        </span>
      </div>

      {isAnyLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
          {Array.from({ length: 8 }).map((_, i) => (
            <TweakcnThemeCardSkeleton key={`skel-${i}`} />
          ))}
        </div>
      ) : hasAnyResults ? (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
            {visibleDesignSystems.map((ds) => (
              <DesignSystemCard
                key={ds.id}
                designSystem={ds}
                onPreview={onPreview}
                onUse={onUse}
              />
            ))}
            {visibleThemes.map((theme) => (
              <TweakcnThemeCard
                key={theme.id}
                theme={theme}
                onPreview={(themeId) => onPreview(`themes:${themeId}`)}
                onUse={(themeId) => onUse(`themes:${themeId}`)}
              />
            ))}
          </div>

          <div ref={sentinelRef} className="w-full h-1" />

          {hasMore && (
            <div className="flex justify-center py-8">
              <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
            </div>
          )}
        </>
      ) : (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <PackageOpen className="h-12 w-12 text-muted-foreground/30 mb-4" />
          <p className="text-lg font-medium text-muted-foreground mb-1">
            No themes found
          </p>
          <p className="text-sm text-muted-foreground/60">
            Try adjusting your filters or search query
          </p>
        </div>
      )}
    </section>
  );
};
