import type { DesignSystemType } from "@/ipc/types/design_systems";
import { Eye, Sparkles } from "lucide-react";
import type React from "react";
import { useEffect, useRef, useState } from "react";
import { Badge } from "./ui/badge";
import { Button } from "./ui/button";
import { Card, CardContent } from "./ui/card";

const IFRAME_RENDER_WIDTH = 1280;

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
  const containerRef = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(0);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    const updateScale = () => {
      const width = el.offsetWidth;
      if (width > 0) {
        setScale(width / IFRAME_RENDER_WIDTH);
      }
    };

    updateScale();
    const observer = new ResizeObserver(() => updateScale());
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  const previewUrl = `anyon-preview://${designSystem.id}/index.html`;
  const iframeHeight = scale > 0 ? Math.ceil(180 / scale) : 960;

  return (
    <Card
      data-testid={`design-system-card-${designSystem.id}`}
      className="overflow-hidden group hover:shadow-md transition-shadow duration-200"
    >
      <div
        ref={containerRef}
        className="relative h-[180px] w-full overflow-hidden"
        style={{
          background: `linear-gradient(135deg, ${designSystem.colorScheme.primary} 0%, ${designSystem.colorScheme.secondary} 100%)`,
        }}
      >
        {scale > 0 && (
          <iframe
            src={previewUrl}
            sandbox="allow-scripts allow-same-origin"
            loading="lazy"
            tabIndex={-1}
            title={`${designSystem.displayName} preview`}
            className="absolute top-0 left-0 border-none pointer-events-none"
            style={{
              width: `${IFRAME_RENDER_WIDTH}px`,
              height: `${iframeHeight}px`,
              transform: `scale(${scale})`,
              transformOrigin: "top left",
            }}
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
