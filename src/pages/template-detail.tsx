import { CommunityCodeConsentDialog } from "@/components/CommunityCodeConsentDialog";
import { CreateAppDialog } from "@/components/CreateAppDialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useSettings } from "@/hooks/useSettings";
import { useTemplates } from "@/hooks/useTemplates";
import { ipc } from "@/ipc/types";
import { showWarning } from "@/lib/toast";
import { useRouter } from "@tanstack/react-router";
import { ArrowLeft, Check, ExternalLink } from "lucide-react";
import type React from "react";
import { useState } from "react";
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
  const { settings, updateSettings } = useSettings();
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [showConsentDialog, setShowConsentDialog] = useState(false);

  const template = templates?.find((t) => t.id === templateId);

  if (!template) {
    return (
      <div className="min-h-screen px-8 py-4">
        <div className="max-w-5xl mx-auto pb-12">
          <Button
            onClick={() => router.history.back()}
            variant="outline"
            size="sm"
            className="flex items-center gap-2 mb-4 bg-(--background-lightest) py-5"
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
    if (!template.isOfficial && !settings?.acceptedCommunityCode) {
      setShowConsentDialog(true);
      return;
    }

    if (template.requiresNeon && !settings?.neon?.accessToken) {
      showWarning(t("templateDetail.neonRequired", { ns: "app" }));
      return;
    }

    updateSettings({ selectedTemplateId: template.id });
    setIsCreateDialogOpen(true);
  };

  const handleConsentAccept = () => {
    updateSettings({ acceptedCommunityCode: true });
    setShowConsentDialog(false);
    updateSettings({ selectedTemplateId: template.id });
    setIsCreateDialogOpen(true);
  };

  const handleConsentCancel = () => {
    setShowConsentDialog(false);
  };

  return (
    <div className="min-h-screen px-8 py-4">
      <div className="max-w-5xl mx-auto pb-12">
        <Button
          onClick={() => router.history.back()}
          variant="outline"
          size="sm"
          className="flex items-center gap-2 mb-4 bg-(--background-lightest) py-5"
        >
          <ArrowLeft className="h-4 w-4" />
          {t("templateDetail.backToMarketplace", { ns: "app" })}
        </Button>

        {/* Hero Section */}
        <div className="flex flex-col lg:flex-row gap-8 mb-8">
          {/* Left: Main Image */}
          <div className="lg:w-1/2">
            <img
              src={template.imageUrl}
              alt={template.title}
              className="w-full rounded-xl shadow-sm object-cover"
            />
          </div>

          {/* Right: Info */}
          <div className="lg:w-1/2">
            {template.category && (
              <Badge variant="outline" className="text-xs capitalize">
                {template.category}
              </Badge>
            )}
            <h1 className="text-3xl font-bold text-foreground mt-2">
              {template.title}
            </h1>
            {template.author && (
              <p className="text-muted-foreground mt-1">
                {t("templateDetail.byAuthor", {
                  ns: "app",
                  author: template.author.name,
                })}
              </p>
            )}

            {/* CTA Buttons */}
            <div className="flex flex-col gap-3 mt-6">
              <Button className="w-full text-lg py-6" onClick={handleChoose}>
                {t("templateDetail.chooseTemplate", { ns: "app" })}
              </Button>
              <div className="flex gap-2">
                {template.githubUrl && (
                  <Button
                    variant="outline"
                    className="flex-1"
                    onClick={() =>
                      ipc.system.openExternalUrl(template.githubUrl!)
                    }
                  >
                    <ExternalLink className="h-4 w-4 mr-2" />
                    {t("templateDetail.viewOnGitHub", { ns: "app" })}
                  </Button>
                )}
                {template.demoUrl && (
                  <Button
                    variant="outline"
                    className="flex-1"
                    onClick={() =>
                      ipc.system.openExternalUrl(template.demoUrl!)
                    }
                  >
                    <ExternalLink className="h-4 w-4 mr-2" />
                    {t("templateDetail.liveDemo", { ns: "app" })}
                  </Button>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* About Section */}
        <section className="mb-8">
          <h2 className="text-xl font-semibold text-foreground mb-3">
            {t("templateDetail.about", { ns: "app" })}
          </h2>
          <p className="text-muted-foreground leading-relaxed">
            {template.longDescription || template.description}
          </p>
        </section>

        {/* Features Section */}
        {template.features && template.features.length > 0 && (
          <section className="mb-8">
            <h2 className="text-xl font-semibold text-foreground mb-3">
              {t("templateDetail.features", { ns: "app" })}
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
              {template.features.map((feature) => (
                <div key={feature} className="flex items-center gap-2">
                  <Check className="h-4 w-4 text-green-500 flex-shrink-0" />
                  <span className="text-sm text-foreground">{feature}</span>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Tech Stack Section */}
        {template.techStack && template.techStack.length > 0 && (
          <section className="mb-8">
            <h2 className="text-xl font-semibold text-foreground mb-3">
              {t("templateDetail.techStack", { ns: "app" })}
            </h2>
            <div className="flex flex-wrap gap-2">
              {template.techStack.map((tech) => (
                <span
                  key={tech}
                  className="text-sm px-3 py-1 rounded-full bg-muted text-muted-foreground"
                >
                  {tech}
                </span>
              ))}
            </div>
          </section>
        )}

        {/* Screenshots Gallery */}
        {template.screenshots && template.screenshots.length > 0 && (
          <section className="mb-8">
            <h2 className="text-xl font-semibold text-foreground mb-3">
              {t("templateDetail.screenshots", { ns: "app" })}
            </h2>
            <div className="flex overflow-x-auto gap-4 pb-4 snap-x">
              {template.screenshots.map((src, index) => (
                <img
                  key={index}
                  src={src}
                  alt={t("templateDetail.screenshotAlt", {
                    ns: "app",
                    title: template.title,
                    index: index + 1,
                  })}
                  className="h-64 rounded-lg shadow-sm snap-start flex-shrink-0"
                />
              ))}
            </div>
          </section>
        )}
      </div>

      <CreateAppDialog
        open={isCreateDialogOpen}
        onOpenChange={setIsCreateDialogOpen}
        template={template}
      />

      <CommunityCodeConsentDialog
        isOpen={showConsentDialog}
        onAccept={handleConsentAccept}
        onCancel={handleConsentCancel}
      />
    </div>
  );
};

export default TemplateDetailPage;
