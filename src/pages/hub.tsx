import React, { useState, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ArrowLeft, Search, Smartphone, Globe, Briefcase } from "lucide-react";
import { useRouter } from "@tanstack/react-router";
import { useTemplates } from "@/hooks/useTemplates";
import { TemplateCard } from "@/components/TemplateCard";
import type { TemplateCategory } from "@/shared/templates";
import { cn } from "@/lib/utils";

const CATEGORIES: {
  key: TemplateCategory;
  label: string;
  icon: React.FC<{ className?: string }>;
}[] = [
  { key: "apps", label: "Apps", icon: Smartphone },
  { key: "web", label: "Web", icon: Globe },
  { key: "saas", label: "SaaS", icon: Briefcase },
];

const HubPage: React.FC = () => {
  const router = useRouter();
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
          Go Back
        </Button>

        <header className="mb-8 text-left">
          <h1 className="text-3xl font-bold text-foreground mb-2">
            Marketplace
          </h1>
          <p className="text-md text-muted-foreground">
            Browse ready-to-use templates for your next project.
            {isLoading && " Loading additional templates..."}
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
                    : "border-border bg-card hover:bg-accent/50"
                )}
              >
                <Icon
                  className={cn(
                    "h-8 w-8 mb-2",
                    isSelected ? "text-foreground" : "text-muted-foreground"
                  )}
                />
                <span className="font-semibold text-foreground">
                  {cat.label}
                </span>
                <span className="text-xs text-muted-foreground mt-1">
                  {categoryCounts[cat.key]} templates
                </span>
              </div>
            );
          })}
        </div>

        {/* Search Bar */}
        <div className="relative mb-6">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search templates..."
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
            {isLoading ? "Loading templates..." : "No templates found."}
          </div>
        )}
      </div>
    </div>
  );
};

export default HubPage;
