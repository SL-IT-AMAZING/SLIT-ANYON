import type { DesignSystemType } from "@/ipc/types/design_systems";
import { Eye, Sparkles } from "lucide-react";
import type React from "react";
import { useState } from "react";
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
  const [imageError, setImageError] = useState(false);

  return (
    <Card
      data-testid={`design-system-card-${designSystem.id}`}
      className="overflow-hidden group hover:shadow-md transition-shadow duration-200"
    >
      <div
        className="relative h-[180px] w-full overflow-hidden"
        style={{
          background: `linear-gradient(135deg, ${designSystem.colorScheme.primary} 0%, ${designSystem.colorScheme.secondary} 100%)`,
        }}
      >
        {!imageError && (
          <img
            src={`/${designSystem.thumbnailPath}`}
            alt={`${designSystem.displayName} preview`}
            className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-[1.02]"
            onError={() => setImageError(true)}
          />
        )}
      </div>
      <CardContent className="p-4">
        <div className="flex items-center justify-between gap-2 mb-2">
          <Badge variant="outline" className="text-xs capitalize">
            {designSystem.category}
          </Badge>
          <span className="text-xs text-muted-foreground">
            {designSystem.componentCount} components
          </span>
        </div>
        <h3 className="text-lg font-semibold text-foreground leading-tight">
          {designSystem.displayName}
        </h3>
        <p className="text-xs text-muted-foreground mt-1">
          {designSystem.libraryName}
        </p>

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
