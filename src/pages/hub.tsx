import { TemplateCard } from "@/components/TemplateCard";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useTemplates } from "@/hooks/useTemplates";
import { cn } from "@/lib/utils";
import type { TemplateCategory } from "@/shared/templates";
import { useRouter } from "@tanstack/react-router";
import { ArrowLeft, Briefcase, Globe, Search, Smartphone } from "lucide-react";
import type React from "react";
import { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";

const CATEGORIES: {
  key: TemplateCategory;
  labelKey:
    | "hub.categories.apps"
    | "hub.categories.web"
    | "hub.categories.saas";
  icon: React.FC<{ className?: string }>;
}[] = [
  { key: "apps", labelKey: "hub.categories.apps", icon: Smartphone },
  { key: "web", labelKey: "hub.categories.web", icon: Globe },
  { key: "saas", labelKey: "hub.categories.saas", icon: Briefcase },
];

const HubPage: React.FC = () => {
  const router = useRouter();
  const { t } = useTranslation(["app", "common"]);
  const { templates, isLoading } = useTemplates();
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] =
    useState<TemplateCategory>("apps");

  const categoryCounts = useMemo(() => {
    const counts: Record<TemplateCategory, number> = {
      apps: 0,
      web: 0,
      saas: 0,
    };
    templates?.forEach((t) => {
      if (t.category && t.category in counts) {
        counts[t.category]++;
      }
    });
    return counts;
  }, [templates]);

  const filteredTemplates = useMemo(() => {
    return templates?.filter((t) => {
      const matchesCategory = t.category === selectedCategory;
      const query = searchQuery.toLowerCase();
      const matchesSearch =
        !searchQuery ||
        t.title.toLowerCase().includes(query) ||
        t.description.toLowerCase().includes(query) ||
        t.tags?.some((tag) => tag.toLowerCase().includes(query));
      return matchesCategory && matchesSearch;
    });
  }, [templates, selectedCategory, searchQuery]);

  return (
    <div className="min-h-screen px-8 py-4">
      <div className="max-w-6xl mx-auto pb-12">
        <Button
          onClick={() => router.history.back()}
          variant="outline"
          size="sm"
          className="flex items-center gap-2 mb-4 bg-(--background-lightest) py-5"
        >
          <ArrowLeft className="h-4 w-4" />
          {t("buttons.back", { ns: "common" })}
        </Button>

        <header className="mb-8 text-left">
          <h1 className="text-3xl font-bold text-foreground mb-2">
            {t("hub.title")}
          </h1>
          <p className="text-md text-muted-foreground">
            {t("hub.description")}
            {isLoading && ` ${t("hub.loadingMore")}`}
          </p>
        </header>

        {/* Category Cards */}
        <div className="grid grid-cols-3 gap-4 mb-6">
          {CATEGORIES.map((cat) => {
            const isSelected = selectedCategory === cat.key;
            const Icon = cat.icon;
            return (
              <div
                key={cat.key}
                onClick={() => setSelectedCategory(cat.key)}
                className={cn(
                  "flex flex-col items-center justify-center p-6 rounded-xl border cursor-pointer transition-colors duration-200",
                  isSelected
                    ? "border-foreground/30 bg-accent"
                    : "border-border bg-card hover:bg-accent/50",
                )}
              >
                <Icon
                  className={cn(
                    "h-8 w-8 mb-2",
                    isSelected ? "text-foreground" : "text-muted-foreground",
                  )}
                />
                <span className="font-semibold text-foreground">
                  {t(cat.labelKey)}
                </span>
                <span className="text-xs text-muted-foreground mt-1">
                  {t("hub.templateCount", { count: categoryCounts[cat.key] })}
                </span>
              </div>
            );
          })}
        </div>

        {/* Search Bar */}
        <div className="relative mb-6">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder={t("hub.searchPlaceholder")}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10 w-full"
          />
        </div>

        {/* Template Grid */}
        {filteredTemplates && filteredTemplates.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredTemplates.map((template) => (
              <TemplateCard key={template.id} template={template} />
            ))}
          </div>
        ) : (
          <div className="text-muted-foreground text-center py-12">
            {isLoading ? t("hub.loadingTemplates") : t("hub.noTemplates")}
          </div>
        )}
      </div>
    </div>
  );
};

export default HubPage;
