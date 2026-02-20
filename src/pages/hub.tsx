import { HubList } from "@/components/HubList";
import { TemplateCard } from "@/components/TemplateCard";
import { Input } from "@/components/ui/input";
import { useTemplates } from "@/hooks/useTemplates";
import { Search, Store } from "lucide-react";
import type React from "react";
import { useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";

const HubPage: React.FC = () => {
  const { t } = useTranslation(["app", "common"]);
  const { templates, categories, isLoading } = useTemplates();
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("apps");

  useEffect(() => {
    if (categories.length === 0) {
      return;
    }

    if (!categories.some((category) => category.id === selectedCategory)) {
      setSelectedCategory(categories[0].id);
    }
  }, [categories, selectedCategory]);

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
    <div className="flex h-full w-full">
      <aside className="w-56 shrink-0 border-r border-border bg-card overflow-y-auto">
        <HubList
          categories={categories}
          selectedCategory={selectedCategory}
          onSelectCategory={setSelectedCategory}
        />
      </aside>

      <div className="flex-1 min-w-0 px-8 py-6 overflow-y-auto">
        <h1 className="text-3xl font-bold mb-5">
          <Store className="inline-block h-8 w-8 mr-2" />
          {t("hub.title")}
        </h1>

        <p className="text-sm text-muted-foreground mb-6">
          {t("hub.description")}
          {isLoading && ` ${t("hub.loadingMore")}`}
        </p>

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
