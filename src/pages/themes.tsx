import { CreateAppDialog } from "@/components/CreateAppDialog";
import { DesignSystemGallery, type SortOption } from "@/components/DesignSystemGallery";
import { DesignSystemPreviewDialog } from "@/components/DesignSystemPreviewDialog";
import {
  type LibraryFilter,
  LibraryList,
} from "@/components/LibraryList";
import { useTweakcnThemes } from "@/hooks/useTweakcnThemes";
import type { ThemeTag } from "@/lib/color-utils";
import { ALL_THEME_TAGS, generateThemeTags } from "@/lib/color-utils";
import { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";

const ThemesPage = () => {
  const { t } = useTranslation("app");
  const { themes, isLoading: isThemesLoading } = useTweakcnThemes();

  const [selectedFilter, setSelectedFilter] = useState<LibraryFilter>("all");
  const [selectedTags, setSelectedTags] = useState<ThemeTag[]>([]);
  const [sortOption, setSortOption] = useState<SortOption>("popular");
  const [searchQuery, setSearchQuery] = useState("");
  const [previewDesignSystemId, setPreviewDesignSystemId] = useState<string | null>(
    null,
  );
  const [selectedDesignSystemId, setSelectedDesignSystemId] = useState<
    string | undefined
  >(undefined);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);

  const tagCounts = useMemo(() => {
    const counts = Object.fromEntries(ALL_THEME_TAGS.map((tag) => [tag, 0])) as Record<
      ThemeTag,
      number
    >;

    for (const theme of themes) {
      const tags = generateThemeTags(theme.cssVars.light);
      for (const tag of tags) {
        counts[tag] += 1;
      }
    }

    return counts;
  }, [themes]);

  const handlePreviewDesignSystem = (id: string) => {
    setPreviewDesignSystemId(id);
  };

  const handleUseDesignSystem = (id: string) => {
    setPreviewDesignSystemId(null);
    setSelectedDesignSystemId(id);
    setIsCreateDialogOpen(true);
  };

  return (
    <div className="flex h-full min-h-0">
      <aside className="w-[260px] shrink-0 border-r border-border bg-card">
        <LibraryList
          selectedFilter={selectedFilter}
          onFilterChange={setSelectedFilter}
          selectedTags={selectedTags}
          onTagsChange={setSelectedTags}
          tagCounts={tagCounts}
          isLoading={isThemesLoading}
        />
      </aside>

      <section className="flex-1 min-w-0 px-8 py-6 overflow-y-auto">
        <div className="flex items-center justify-between mb-2">
          <h1 className="text-2xl font-bold tracking-tight">
            {t("library.themes.title", { defaultValue: "Themes" })}
          </h1>
        </div>
        <p className="text-sm text-muted-foreground mb-5">
          {t("library.title", { defaultValue: "Library" })}
        </p>

        <DesignSystemGallery
          onPreview={handlePreviewDesignSystem}
          onUse={handleUseDesignSystem}
          selectedFilter={selectedFilter}
          selectedTags={selectedTags}
          sortOption={sortOption}
          onSortChange={setSortOption}
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
        />
      </section>

      <DesignSystemPreviewDialog
        designSystemId={previewDesignSystemId}
        open={previewDesignSystemId !== null}
        onOpenChange={(open) => {
          if (!open) {
            setPreviewDesignSystemId(null);
          }
        }}
        onUseDesignSystem={handleUseDesignSystem}
      />

      <CreateAppDialog
        open={isCreateDialogOpen}
        onOpenChange={(open) => {
          setIsCreateDialogOpen(open);
          if (!open) {
            setSelectedDesignSystemId(undefined);
          }
        }}
        template={undefined}
        initialDesignSystemId={selectedDesignSystemId}
      />
    </div>
  );
};

export default ThemesPage;
