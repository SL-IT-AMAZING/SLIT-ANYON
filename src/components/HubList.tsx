import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";
import type { TemplateCategory } from "@/shared/templates";
import { Briefcase, Globe, Smartphone } from "lucide-react";
import type { ComponentType } from "react";
import { useTranslation } from "react-i18next";

type HubSection = {
  id: string;
  label: string;
  icon: ComponentType<{ className?: string }>;
};

interface HubListProps {
  categories: TemplateCategory[];
  selectedCategory: string;
  onSelectCategory: (category: string) => void;
}

export function HubList({
  categories,
  selectedCategory,
  onSelectCategory,
}: HubListProps) {
  const { t } = useTranslation("app");
  const fallbackCategories: TemplateCategory[] = [
    {
      id: "apps",
      label: t("hub.categories.apps"),
    },
    {
      id: "web",
      label: t("hub.categories.web"),
    },
    {
      id: "saas",
      label: t("hub.categories.saas"),
    },
  ];

  const iconMap: Record<string, ComponentType<{ className?: string }>> = {
    apps: Smartphone,
    web: Globe,
    saas: Briefcase,
  };

  const hubSections: HubSection[] = (
    categories.length > 0 ? categories : fallbackCategories
  ).map((category) => ({
    id: category.id,
    label: category.label,
    icon: iconMap[category.id] ?? Briefcase,
  }));

  return (
    <div className="flex flex-col h-full">
      <div className="flex-shrink-0 p-4">
        <h2 className="text-lg font-semibold tracking-tight">
          {t("hub.title")}
        </h2>
      </div>
      <ScrollArea className="flex-grow">
        <div className="space-y-1 p-4 pt-0">
          {hubSections.map((section) => {
            const isActive = selectedCategory === section.id;

            return (
              <button
                key={section.id}
                type="button"
                onClick={() => onSelectCategory(section.id)}
                className={cn(
                  "w-full flex items-center gap-2 px-3 py-2 rounded-md text-sm transition-colors",
                  isActive
                    ? "bg-sidebar-accent text-sidebar-accent-foreground font-semibold"
                    : "hover:bg-sidebar-accent",
                )}
              >
                <section.icon className="h-4 w-4" />
                {section.label}
              </button>
            );
          })}
        </div>
      </ScrollArea>
    </div>
  );
}
