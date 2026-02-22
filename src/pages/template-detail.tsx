import { CreateAppDialog } from "@/components/CreateAppDialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useSettings } from "@/hooks/useSettings";
import { useTemplates } from "@/hooks/useTemplates";
import { ipc } from "@/ipc/types";
import { useRouter } from "@tanstack/react-router";
import {
  ArrowLeft,
  Check,
  ChevronLeft,
  ChevronRight,
  ExternalLink,
  RotateCw,
} from "lucide-react";
import type React from "react";
import { useEffect, useMemo, useRef, useState } from "react";
import { useTranslation } from "react-i18next";

interface TemplateDetailPageProps {
  templateId: string;
}

const TemplateDetailPage: React.FC<TemplateDetailPageProps> = ({
  templateId,
}) => {
  const { t } = useTranslation(["app", "common"]);
  const router = useRouter();
  const { templates } = useTemplates();
  const { updateSettings } = useSettings();
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [previewHtml, setPreviewHtml] = useState<string | null>(null);
  const [previewScale, setPreviewScale] = useState(0.5);
  const previewContainerRef = useRef<HTMLDivElement>(null);

  const template = templates?.find((t) => t.id === templateId);

  useEffect(() => {
    if (!template) return;
    ipc.template
      .getTemplateContent({ templatePath: template.path })
      .then((result) => setPreviewHtml(result.html))
      .catch(() => setPreviewHtml(""));
  }, [template]);

  useEffect(() => {
    const container = previewContainerRef.current;
    if (!container) return;
    const observer = new ResizeObserver((entries) => {
      const width = entries[0]?.contentRect.width;
      if (width) setPreviewScale(width / 1280);
    });
    observer.observe(container);
    return () => observer.disconnect();
  }, []);

  const previewBlobUrl = useMemo(() => {
    if (!previewHtml || previewHtml.length === 0) {
      return null;
    }

    const blob = new Blob([previewHtml], { type: "text/html" });
    return URL.createObjectURL(blob);
  }, [previewHtml]);

  useEffect(() => {
    return () => {
      if (previewBlobUrl) {
        URL.revokeObjectURL(previewBlobUrl);
      }
    };
  }, [previewBlobUrl]);

  if (!template) {
    return (
      <div className="min-h-screen px-8 py-4">
        <div className="max-w-5xl mx-auto pb-12">
          <Button
            onClick={() => router.history.back()}
            variant="ghost"
            size="sm"
            className="flex items-center gap-2 mb-4"
          >
            <ArrowLeft className="h-4 w-4" />
            {t("templateDetail.backToMarketplace", { ns: "app" })}
          </Button>
          <div className="text-muted-foreground text-center py-12">
            {t("templateDetail.notFound", { ns: "app" })}
          </div>
        </div>
      </div>
    );
  }

  const handleChoose = () => {
    updateSettings({ selectedTemplateId: template.id });
    setIsCreateDialogOpen(true);
  };

  return (
    <div className="min-h-screen px-8 py-4">
      <div className="max-w-5xl mx-auto pb-12">
        <div className="flex items-center justify-between mb-6">
          <Button
            onClick={() => router.history.back()}
            variant="ghost"
            size="sm"
            className="flex items-center gap-2"
          >
            <ArrowLeft className="h-4 w-4" />
            {t("templateDetail.backToMarketplace", { ns: "app" })}
          </Button>
          <Button onClick={handleChoose}>
            {t("templateDetail.chooseTemplate", { ns: "app" })}
          </Button>
        </div>

        <div className="mb-6">
          {template.category && (
            <Badge variant="outline" className="text-xs capitalize mb-1">
              {template.category}
            </Badge>
          )}
          <h1 className="text-3xl font-bold text-foreground">
            {template.title}
          </h1>
        </div>

        <div className="rounded-xl border border-border overflow-hidden mb-10">
          <div className="flex items-center h-10 px-3 bg-muted/50 border-b border-border gap-2">
            <div className="flex items-center gap-0.5 text-muted-foreground/50">
              <ChevronLeft className="h-4 w-4" />
              <ChevronRight className="h-4 w-4" />
            </div>
            <div className="flex-1 flex items-center justify-center">
              <div className="text-xs text-muted-foreground bg-background px-4 py-1 rounded-md border border-border max-w-xs truncate">
                /
              </div>
            </div>
            <div className="flex items-center gap-2 text-muted-foreground/50">
              <ExternalLink className="h-3.5 w-3.5" />
              <RotateCw className="h-3.5 w-3.5" />
            </div>
          </div>

          <div
            ref={previewContainerRef}
            className="relative overflow-hidden bg-white"
            style={{ aspectRatio: "16 / 9" }}
          >
            {previewBlobUrl ? (
              <iframe
                src={previewBlobUrl}
                title={template.title}
                className="absolute top-0 left-0 border-none"
                style={{
                  width: "1280px",
                  height: `${1200 / previewScale}px`,
                  zoom: previewScale,
                }}
              />
            ) : previewHtml === null ? (
              <div className="w-full h-full flex items-center justify-center">
                <div className="w-8 h-8 border-2 border-muted-foreground/30 border-t-muted-foreground rounded-full animate-spin" />
              </div>
            ) : (
              <div className="w-full h-full flex items-center justify-center text-sm text-muted-foreground">
                Preview unavailable
              </div>
            )}
          </div>
        </div>

        <div className="flex flex-col lg:flex-row gap-10 border-t border-border pt-8">
          <div className="lg:w-3/5">
            <h2 className="text-lg font-semibold text-foreground mb-3">
              {t("templateDetail.about", { ns: "app" })}
            </h2>
            <p className="text-muted-foreground leading-relaxed">
              {template.longDescription || template.description}
            </p>

            {template.features && template.features.length > 0 && (
              <div className="mt-6">
                <h3 className="text-base font-semibold text-foreground mb-2">
                  {t("templateDetail.features", { ns: "app" })}
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                  {template.features.map((feature) => (
                    <div key={feature} className="flex items-center gap-2">
                      <Check className="h-4 w-4 text-green-500 flex-shrink-0" />
                      <span className="text-sm text-foreground">{feature}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          <div className="lg:w-2/5">
            {template.tags && template.tags.length > 0 && (
              <div className="mb-6">
                <h2 className="text-lg font-semibold text-foreground mb-3">
                  {t("templateDetail.tags", { ns: "app" })}
                </h2>
                <div className="flex flex-wrap gap-2">
                  {template.tags.map((tag) => (
                    <span
                      key={tag}
                      className="text-sm px-3 py-1 rounded-full border border-border text-muted-foreground"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {template.techStack && template.techStack.length > 0 && (
              <div className="mb-6 pt-6 border-t border-border">
                <h2 className="text-lg font-semibold text-foreground mb-3">
                  {t("templateDetail.techStack", { ns: "app" })}
                </h2>
                <div className="flex flex-wrap gap-2">
                  {template.techStack.map((tech) => (
                    <span
                      key={tech}
                      className="text-sm px-3 py-1 rounded-full border border-border text-muted-foreground"
                    >
                      {tech}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      <CreateAppDialog
        open={isCreateDialogOpen}
        onOpenChange={setIsCreateDialogOpen}
        template={template}
      />
    </div>
  );
};

export default TemplateDetailPage;
