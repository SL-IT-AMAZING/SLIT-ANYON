import { TemplateCard } from "@/components/TemplateCard";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { useTemplates } from "@/hooks/useTemplates";
import { cn } from "@/lib/utils";
import { Search, Store } from "lucide-react";
import type React from "react";
import { useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";

const HubPage: React.FC = () => {
  const { t } = useTranslation(["app", "common"]);
  const { templates, categories, isLoading } = useTemplates();
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("apps");
  const [sortBy, setSortBy] = useState<"trending" | "newest" | "most-used">(
    "trending",
  );

  useEffect(() => {
    if (categories.length === 0) {
      return;
    }

    if (!categories.some((category) => category.id === selectedCategory)) {
      setSelectedCategory(categories[0].id);
    }
  }, [categories, selectedCategory]);

  const filteredTemplates = useMemo(() => {
    const filtered = templates?.filter((t) => {
      const matchesCategory = t.category === selectedCategory;
      const query = searchQuery.toLowerCase();
      const matchesSearch =
        !searchQuery ||
        t.title.toLowerCase().includes(query) ||
        t.description.toLowerCase().includes(query) ||
        t.tags?.some((tag) => tag.toLowerCase().includes(query));
      return matchesCategory && matchesSearch;
    });
    if (!filtered) return filtered;
    if (sortBy === "newest") return [...filtered].reverse();
    return filtered;
  }, [templates, selectedCategory, searchQuery, sortBy]);

  return (
    <div className="flex-1 min-w-0 px-8 py-6 overflow-y-auto">
      <div className="flex items-center justify-between mb-2">
        <h1 className="text-2xl font-bold tracking-tight">{t("hub.title")}</h1>
      </div>
      <p className="text-sm text-muted-foreground mb-5">
        {t("hub.description")}
      </p>

      <div className="flex items-center gap-1 mb-5 overflow-x-auto pb-1">
        {(categories.length > 0
          ? categories
          : [
              { id: "apps", label: "Apps" },
              { id: "web", label: "Web" },
              { id: "saas", label: "SaaS" },
            ]
        ).map((category) => (
          <button
            key={category.id}
            type="button"
            onClick={() => setSelectedCategory(category.id)}
            className={cn(
              "px-4 py-1.5 rounded-full text-sm font-medium whitespace-nowrap transition-colors",
              selectedCategory === category.id
                ? "bg-foreground text-background"
                : "bg-muted text-muted-foreground hover:bg-muted/80 hover:text-foreground",
            )}
          >
            {category.label}
          </button>
        ))}
      </div>

      <div className="flex items-center gap-3 mb-6">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder={t("hub.searchPlaceholder")}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10 w-full"
          />
        </div>
      </div>

      <div className="flex items-center justify-between mb-5">
        <div className="flex items-center gap-1 text-sm">
          {(
            [
              {
                key: "trending" as const,
                label: t("hub.sortTrending", { defaultValue: "Trending" }),
              },
              {
                key: "newest" as const,
                label: t("hub.sortNewest", { defaultValue: "Newest" }),
              },
              {
                key: "most-used" as const,
                label: t("hub.sortMostUsed", { defaultValue: "Most Used" }),
              },
            ] as const
          ).map((option, idx) => (
            <span key={option.key} className="flex items-center">
              {idx > 0 && (
                <span className="text-muted-foreground/40 mx-1.5">·</span>
              )}
              <button
                type="button"
                onClick={() => setSortBy(option.key)}
                className={cn(
                  "transition-colors",
                  sortBy === option.key
                    ? "font-semibold text-foreground"
                    : "text-muted-foreground hover:text-foreground",
                )}
              >
                {option.label}
              </button>
            </span>
          ))}
        </div>
        <span className="text-xs text-muted-foreground">
          {t("hub.showingCount", {
            defaultValue: "Showing {{count}} templates",
            count: filteredTemplates?.length ?? 0,
          })}
        </span>
      </div>

      {/* Template Grid */}
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-x-6 gap-y-10">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={`skeleton-${i}`}>
              <Skeleton
                className="w-full rounded-xl"
                style={{ aspectRatio: "16/10" }}
              />
              <div className="px-1 pt-3">
                <Skeleton className="h-4 w-3/4 mb-2" />
                <Skeleton className="h-3 w-full" />
              </div>
            </div>
          ))}
        </div>
      ) : filteredTemplates && filteredTemplates.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-x-6 gap-y-10">
          {filteredTemplates.map((template) => (
            <TemplateCard key={template.id} template={template} />
          ))}
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <Store className="h-12 w-12 text-muted-foreground/30 mb-4" />
          <p className="text-muted-foreground font-medium">
            {searchQuery ? t("hub.noTemplates") : t("hub.noTemplates")}
          </p>
          {searchQuery && (
            <button
              type="button"
              onClick={() => setSearchQuery("")}
              className="mt-2 text-sm text-primary hover:underline"
            >
              {t("hub.clearSearch", { defaultValue: "Clear search" })}
            </button>
          )}
        </div>
      )}
    </div>
  );
};

export default HubPage;
