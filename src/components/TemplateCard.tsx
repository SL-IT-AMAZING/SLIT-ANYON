import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import type { Template } from "@/shared/templates";
import { useNavigate } from "@tanstack/react-router";
import { Globe } from "lucide-react";
import type React from "react";
import { useCallback, useState } from "react";
import { useTranslation } from "react-i18next";

interface TemplateCardProps {
  template: Template;
}

function hashToGradient(str: string): string {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = str.charCodeAt(i) + ((hash << 5) - hash);
  }
  const h1 = Math.abs(hash) % 360;
  const h2 = (h1 + 40) % 360;
  return `linear-gradient(135deg, hsl(${h1}, 40%, 90%) 0%, hsl(${h2}, 50%, 85%) 100%)`;
}

export const TemplateCard: React.FC<TemplateCardProps> = ({ template }) => {
  const { t } = useTranslation(["app"]);
  const navigate = useNavigate();
  const [hasError, setHasError] = useState(false);
  const [isLoaded, setIsLoaded] = useState(false);
  const [trackedImageUrl, setTrackedImageUrl] = useState(template.imageUrl);

  if (template.imageUrl !== trackedImageUrl) {
    setTrackedImageUrl(template.imageUrl);
    setHasError(false);
    setIsLoaded(false);
  }

  const handleCardClick = useCallback(() => {
    navigate({ to: "/hub/$templateId", params: { templateId: template.id } });
  }, [navigate, template.id]);

  const showImage = !!template.imageUrl && !hasError;

  return (
    <button
      type="button"
      onClick={handleCardClick}
      className="cursor-pointer group text-left w-full outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 rounded-xl"
    >
      <div
        className="relative rounded-xl overflow-hidden bg-muted border border-border transition-all duration-200 group-hover:shadow-lg group-hover:scale-[1.02]"
        style={{ aspectRatio: "16 / 10" }}
      >
        {showImage && (
          <img
            src={template.imageUrl}
            alt={template.title}
            loading="lazy"
            className={`w-full h-full object-cover object-top transition-opacity duration-300 ease-out ${
              isLoaded ? "opacity-100" : "opacity-0"
            }`}
            onLoad={() => setIsLoaded(true)}
            onError={() => setHasError(true)}
          />
        )}
        {showImage && !isLoaded && (
          <div className="absolute inset-0 w-full h-full animate-pulse bg-muted" />
        )}
        {!showImage && (
          <div
            className="absolute inset-0 w-full h-full flex flex-col items-center justify-center gap-2"
            style={{ background: hashToGradient(template.title) }}
          >
            <Globe className="h-8 w-8 text-muted-foreground/30" />
            <span className="text-sm font-medium text-muted-foreground/40 select-none">
              {template.title}
            </span>
          </div>
        )}
        {template.category && (
          <div className="absolute top-2 left-2 z-10">
            <Badge
              variant="secondary"
              className="text-[10px] capitalize bg-background/80 backdrop-blur-sm"
            >
              {template.category}
            </Badge>
          </div>
        )}
        <div className="absolute inset-0 z-10 flex items-center justify-center bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
          <Button
            size="sm"
            variant="secondary"
            onClick={(e: React.MouseEvent) => {
              e.stopPropagation();
              navigate({
                to: "/hub/$templateId",
                params: { templateId: template.id },
              });
            }}
          >
            {t("hub.useTemplate", { defaultValue: "Use Template" })}
          </Button>
        </div>
      </div>

      <div className="px-1 pt-3 pb-1">
        <h3 className="text-sm font-semibold text-foreground truncate group-hover:text-primary transition-colors">
          {template.title}
        </h3>
        <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">
          {template.description}
        </p>
      </div>
    </button>
  );
};
