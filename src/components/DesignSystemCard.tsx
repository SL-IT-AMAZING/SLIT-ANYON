import type { DesignSystemType } from "@/ipc/types/design_systems";
import { Eye, Sparkles } from "lucide-react";
import type React from "react";
import { Badge } from "./ui/badge";
import { Button } from "./ui/button";
import { Card, CardContent } from "./ui/card";

interface DesignSystemCardProps {
  designSystem: DesignSystemType;
  onPreview: (id: string) => void;
  onUse: (id: string) => void;
}

export const DesignSystemCard: React.FC<DesignSystemCardProps> = ({
  designSystem,
  onPreview,
  onUse,
}) => {
  return (
    <Card
      data-testid={`design-system-card-${designSystem.id}`}
      className="overflow-hidden group hover:shadow-md transition-shadow duration-200"
    >
      <div
        className="h-[120px] w-full"
        style={{
          background: `linear-gradient(135deg, ${designSystem.colorScheme.primary} 0%, ${designSystem.colorScheme.secondary} 100%)`,
        }}
      />
      <CardContent className="p-4">
        <Badge variant="outline" className="text-xs capitalize">
          {designSystem.category}
        </Badge>
        <h3 className="text-lg font-semibold text-foreground mt-2">
          {designSystem.displayName}
        </h3>
        <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
          {designSystem.description}
        </p>

        {designSystem.tags.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mt-3">
            {designSystem.tags.map((tag) => (
              <span
                key={tag}
                className="text-xs px-2 py-0.5 rounded-full bg-muted text-muted-foreground"
              >
                {tag}
              </span>
            ))}
          </div>
        )}

        <div className="flex items-center gap-2 mt-4">
          <Button
            variant="outline"
            size="sm"
            className="flex-1"
            onClick={() => onPreview(designSystem.id)}
          >
            <Eye className="mr-1 h-4 w-4" />
            Preview
          </Button>
          <Button
            size="sm"
            className="flex-1 bg-indigo-600 hover:bg-indigo-700"
            onClick={() => onUse(designSystem.id)}
          >
            <Sparkles className="mr-1 h-4 w-4" />
            Use This
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};
