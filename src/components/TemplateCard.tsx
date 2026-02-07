import React, { useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import { ipc } from "@/ipc/types";
import { useSettings } from "@/hooks/useSettings";
import { CommunityCodeConsentDialog } from "./CommunityCodeConsentDialog";
import type { Template } from "@/shared/templates";
import { Button } from "./ui/button";
import { Badge } from "./ui/badge";
import { Card, CardContent } from "./ui/card";
import { showWarning } from "@/lib/toast";
import { Github } from "lucide-react";


interface TemplateCardProps {
  template: Template;
}

export const TemplateCard: React.FC<TemplateCardProps> = ({ template }) => {
  const navigate = useNavigate();
  const { settings, updateSettings } = useSettings();
  const [showConsentDialog, setShowConsentDialog] = useState(false);

  const handleCardClick = () => {
    if (!template.isOfficial && !settings?.acceptedCommunityCode) {
      setShowConsentDialog(true);
      return;
    }

    if (template.requiresNeon && !settings?.neon?.accessToken) {
      showWarning("Please connect your Neon account to use this template.");
      return;
    }

    navigate({ to: "/hub/$templateId", params: { templateId: template.id } });
  };

  const handleConsentAccept = () => {
    updateSettings({ acceptedCommunityCode: true });
    setShowConsentDialog(false);
    navigate({ to: "/hub/$templateId", params: { templateId: template.id } });
  };

  const handleConsentCancel = () => {
    setShowConsentDialog(false);
  };

  const handleGithubClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (template.githubUrl) {
      ipc.system.openExternalUrl(template.githubUrl);
    }
  };

  return (
    <>
      <Card
        onClick={handleCardClick}
        className="overflow-hidden cursor-pointer group hover:shadow-md transition-shadow duration-200"
      >
        <img
          src={template.imageUrl}
          alt={template.title}
          className="w-full h-48 object-cover group-hover:opacity-90 transition-opacity duration-200"
        />
        <CardContent className="p-4">
          {template.category && (
            <Badge
              variant="outline"
              className="text-xs capitalize"
            >
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
            {template.githubUrl && (
              <Button
                variant="outline"
                size="icon"
                className="h-9 w-9"
                onClick={handleGithubClick}
              >
                <Github className="h-4 w-4" />
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      <CommunityCodeConsentDialog
        isOpen={showConsentDialog}
        onAccept={handleConsentAccept}
        onCancel={handleConsentCancel}
      />
    </>
  );
};
