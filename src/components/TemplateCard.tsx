import type { Template } from "@/shared/templates";
import { useNavigate } from "@tanstack/react-router";
import type React from "react";
import { Badge } from "./ui/badge";
import { Button } from "./ui/button";
import { Card, CardContent } from "./ui/card";

interface TemplateCardProps {
  template: Template;
}

export const TemplateCard: React.FC<TemplateCardProps> = ({ template }) => {
  const navigate = useNavigate();

  const handleCardClick = () => {
    navigate({ to: "/hub/$templateId", params: { templateId: template.id } });
  };

  return (
    <Card
      onClick={handleCardClick}
      className="overflow-hidden cursor-pointer group hover:shadow-md transition-shadow duration-200"
    >
      <div className="relative w-full h-48 overflow-hidden bg-muted">
        {template.imageUrl ? (
          <img
            src={template.imageUrl}
            alt={template.title}
            className="w-full h-full object-cover group-hover:opacity-90 transition-opacity duration-200"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-4xl font-bold text-muted-foreground/20 select-none">
            {template.title.charAt(0).toUpperCase()}
          </div>
        )}
      </div>
      <CardContent className="p-4">
        {template.category && (
          <Badge variant="outline" className="text-xs capitalize">
            {template.category}
          </Badge>
        )}
        <h3 className="text-lg font-semibold text-foreground mt-2">
          {template.title}
        </h3>
        <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
          {template.description}
        </p>

        {template.techStack && template.techStack.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mt-3">
            {template.techStack.map((tech) => (
              <span
                key={tech}
                className="text-xs px-2 py-0.5 rounded-full bg-muted text-muted-foreground"
              >
                {tech}
              </span>
            ))}
          </div>
        )}

        <div className="flex items-center gap-2 mt-4">
          <Button
            onClick={(e) => {
              e.stopPropagation();
              handleCardClick();
            }}
            size="sm"
            className="flex-1"
          >
            Choose
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};
