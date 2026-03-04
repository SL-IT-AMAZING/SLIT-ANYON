import type { Template } from "@/shared/templates";
import { useNavigate } from "@tanstack/react-router";
import type React from "react";
import { useCallback, useEffect, useState } from "react";

interface TemplateCardProps {
  template: Template;
}

export const TemplateCard: React.FC<TemplateCardProps> = ({ template }) => {
  const navigate = useNavigate();
  const [hasError, setHasError] = useState(false);
  const [isLoaded, setIsLoaded] = useState(false);

  // Reset error/loaded state when imageUrl changes
  useEffect(() => {
    setHasError(false);
    setIsLoaded(false);
  }, [template.imageUrl]);

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
        className="relative rounded-xl overflow-hidden bg-muted"
        style={{ aspectRatio: "16 / 10" }}
      >
        {showImage && (
          <img
            src={template.imageUrl}
            alt={template.title}
            loading="lazy"
            className={`w-full h-full object-cover object-top transition-all duration-300 ease-out group-hover:scale-[1.02] ${
              isLoaded ? "opacity-100" : "opacity-0"
            }`}
            onLoad={() => setIsLoaded(true)}
            onError={() => setHasError(true)}
          />
        )}
        {/* Fallback: show while image is loading, on error, or when no imageUrl */}
        {(!showImage || !isLoaded) && (
          <div className="absolute inset-0 w-full h-full flex items-center justify-center text-4xl font-bold text-muted-foreground/20 select-none">
            {template.title.charAt(0).toUpperCase()}
          </div>
        )}
      </div>

      <div className="px-1 pt-3 pb-1">
        <h3 className="text-sm font-semibold text-foreground truncate">
          {template.title}
        </h3>
        <p className="text-sm text-muted-foreground mt-0.5 truncate">
          {template.description}
        </p>
      </div>
    </button>
  );
};
