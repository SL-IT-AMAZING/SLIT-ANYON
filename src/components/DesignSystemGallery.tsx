import { useDesignSystems } from "@/hooks/useDesignSystems";
import type { DesignSystemType } from "@/ipc/types/design_systems";
import { cn } from "@/lib/utils";
import { Search } from "lucide-react";
import type React from "react";
import { useMemo, useState } from "react";
import { DesignSystemCard } from "./DesignSystemCard";
import { Card } from "./ui/card";
import { Input } from "./ui/input";
import { Skeleton } from "./ui/skeleton";

const CATEGORIES = [
  { key: "all", label: "All" },
  { key: "minimal", label: "Minimal" },
  { key: "material", label: "Material" },
  { key: "enterprise", label: "Enterprise" },
  { key: "modern", label: "Modern" },
  { key: "accessible", label: "Accessible" },
  { key: "playful", label: "Playful" },
] as const;

type CategoryKey = (typeof CATEGORIES)[number]["key"];

interface DesignSystemGalleryProps {
  onPreview: (id: string) => void;
  onUse: (id: string) => void;
}

export const DesignSystemGallery: React.FC<DesignSystemGalleryProps> = ({
  onPreview,
  onUse,
}) => {
  const { designSystems, isLoading } = useDesignSystems();
  const [selectedCategory, setSelectedCategory] = useState<CategoryKey>("all");
  const [searchQuery, setSearchQuery] = useState("");

  const filteredDesignSystems = useMemo(() => {
    return designSystems.filter((ds: DesignSystemType) => {
      const matchesCategory =
        selectedCategory === "all" || ds.category === selectedCategory;
      const query = searchQuery.toLowerCase();
      const matchesSearch =
        !searchQuery ||
        ds.displayName.toLowerCase().includes(query) ||
        ds.description.toLowerCase().includes(query) ||
        ds.tags.some((tag) => tag.toLowerCase().includes(query));
      return matchesCategory && matchesSearch;
    });
  }, [designSystems, selectedCategory, searchQuery]);

  return (
    <section data-testid="design-system-gallery">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-foreground">Design Systems</h2>
        <p className="text-sm text-muted-foreground mt-1">
          Browse visual design concepts for your app
        </p>
      </div>

      {/* Category Filter */}
      <div className="flex flex-wrap gap-2 mb-4">
        {CATEGORIES.map((cat) => {
          const isSelected = selectedCategory === cat.key;
          return (
            <button
              key={cat.key}
              type="button"
              onClick={() => setSelectedCategory(cat.key)}
              className={cn(
                "px-3 py-1.5 rounded-full text-sm font-medium border cursor-pointer transition-colors duration-200",
                isSelected
                  ? "border-foreground/30 bg-accent text-foreground"
                  : "border-border bg-card text-muted-foreground hover:bg-accent/50",
              )}
            >
              {cat.label}
            </button>
          );
        })}
      </div>

      {/* Search */}
      <div className="relative mb-6">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search design systems..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-10 w-full"
        />
      </div>

      {/* Grid */}
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {Array.from({ length: 6 }).map((_, i) => (
            <Card key={`skeleton-${i}`} className="overflow-hidden">
              <Skeleton className="h-[120px] w-full rounded-none" />
              <div className="p-4 space-y-3">
                <Skeleton className="h-4 w-20" />
                <Skeleton className="h-5 w-3/4" />
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-2/3" />
                <div className="flex gap-2 pt-2">
                  <Skeleton className="h-8 flex-1" />
                  <Skeleton className="h-8 flex-1" />
                </div>
              </div>
            </Card>
          ))}
        </div>
      ) : filteredDesignSystems.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredDesignSystems.map((ds) => (
            <DesignSystemCard
              key={ds.id}
              designSystem={ds}
              onPreview={onPreview}
              onUse={onUse}
            />
          ))}
        </div>
      ) : (
        <div className="text-muted-foreground text-center py-12">
          No design systems found matching your criteria.
        </div>
      )}
    </section>
  );
};
