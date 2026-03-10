import { ScrollArea } from "@/components/ui/scroll-area";
import { Skeleton } from "@/components/ui/skeleton";
import type { ThemeTag } from "@/lib/color-utils";
import { ALL_THEME_TAGS } from "@/lib/color-utils";
import { cn } from "@/lib/utils";
import { Link, useRouterState } from "@tanstack/react-router";
import { Heart, Layers, Palette } from "lucide-react";
import { useTranslation } from "react-i18next";

export type LibraryFilter = "all" | "liked";

interface LibraryListProps {
  selectedFilter?: LibraryFilter;
  onFilterChange?: (filter: LibraryFilter) => void;
  selectedTags?: ThemeTag[];
  onTagsChange?: (tags: ThemeTag[]) => void;
  tagCounts?: Record<ThemeTag, number>;
  isLoading?: boolean;
}

const FILTER_PRESETS = [
  { key: "all" as const, label: "All Themes", icon: Layers },
  { key: "liked" as const, label: "Liked", icon: Heart },
];

export function LibraryList({
  selectedFilter = "all",
  onFilterChange,
  selectedTags = [],
  onTagsChange,
  tagCounts = {} as Record<ThemeTag, number>,
  isLoading = false,
}: LibraryListProps) {
  const { t } = useTranslation("app");
  const routerState = useRouterState();
  const pathname = routerState.location.pathname;

  const navSections = [
    {
      id: "themes",
      label: t("library.sections.themes"),
      to: "/themes",
      icon: Palette,
    },
  ];

  const handleTagToggle = (tag: ThemeTag) => {
    if (!onTagsChange) return;
    const next = selectedTags.includes(tag)
      ? selectedTags.filter((t) => t !== tag)
      : [...selectedTags, tag];
    onTagsChange(next);
  };

  return (
    <div className="flex flex-col h-full">
      <div className="flex-shrink-0 p-4 pb-2">
        <h2 className="text-sm font-semibold tracking-tight uppercase text-muted-foreground">
          {t("library.title")}
        </h2>
      </div>

      <ScrollArea className="flex-grow">
        <div className="px-3 pb-2">
          <div className="space-y-0.5">
            {navSections.map((section) => {
              const isActive =
                section.to === pathname ||
                (section.to !== "/" && pathname.startsWith(section.to));

              return (
                <Link
                  key={section.id}
                  to={section.to}
                  className={cn(
                    "w-full flex items-center gap-2 px-3 py-2 rounded-md text-sm transition-colors",
                    isActive
                      ? "bg-sidebar-accent text-sidebar-accent-foreground font-semibold"
                      : "text-muted-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
                  )}
                >
                  <section.icon className="h-4 w-4" />
                  {section.label}
                </Link>
              );
            })}
          </div>
        </div>

        {pathname.startsWith("/themes") && (
          <>
            <div className="mx-3 my-2 border-t border-border" />

            <div className="px-3 pb-2">
              <p className="px-3 mb-1.5 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground/60">
                Filter
              </p>
              <div className="space-y-0.5">
                {FILTER_PRESETS.map((preset) => {
                  const isActive = selectedFilter === preset.key;
                  return (
                    <button
                      key={preset.key}
                      type="button"
                      onClick={() => onFilterChange?.(preset.key)}
                      className={cn(
                        "w-full flex items-center gap-2 px-3 py-1.5 rounded-md text-sm transition-colors cursor-pointer",
                        isActive
                          ? "bg-sidebar-accent text-sidebar-accent-foreground font-medium"
                          : "text-muted-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
                      )}
                    >
                      <preset.icon className="h-3.5 w-3.5" />
                      {preset.label}
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="mx-3 my-2 border-t border-border" />

            <div className="px-3 pb-4">
              <p className="px-3 mb-1.5 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground/60">
                Tags
              </p>
              {isLoading ? (
                <div className="space-y-1.5 px-3">
                  {Array.from({ length: 6 }).map((_, i) => (
                    <Skeleton
                      key={`tag-skel-${i}`}
                      className="h-6 w-full rounded-lg"
                    />
                  ))}
                </div>
              ) : (
                <div className="space-y-0.5">
                  {ALL_THEME_TAGS.map((tag) => {
                    const count = tagCounts[tag] ?? 0;
                    const isActive = selectedTags.includes(tag);
                    return (
                      <button
                        key={tag}
                        type="button"
                        onClick={() => handleTagToggle(tag)}
                        className={cn(
                          "w-full flex items-center justify-between px-3 py-1.5 rounded-md text-sm transition-colors cursor-pointer",
                          isActive
                            ? "bg-sidebar-accent text-sidebar-accent-foreground font-medium"
                            : "text-muted-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
                        )}
                      >
                        <span className="capitalize">{tag}</span>
                        <span
                          className={cn(
                            "text-xs tabular-nums",
                            isActive
                              ? "text-sidebar-accent-foreground/70"
                              : "text-muted-foreground/50",
                          )}
                        >
                          {count}
                        </span>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          </>
        )}
      </ScrollArea>
    </div>
  );
}
