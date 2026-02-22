import { Button } from "@/components/ui/button";
import { AlertTriangle, Download } from "lucide-react";
import { useTranslation } from "react-i18next";

interface NodeMissingBannerProps {
  onInstallClick: () => void;
  nodeVersion?: string | null;
  isOutdated?: boolean;
}

export function NodeMissingBanner({
  onInstallClick,
  nodeVersion,
  isOutdated,
}: NodeMissingBannerProps) {
  const { t } = useTranslation("app");

  const title = t("home.nodeSetup.bannerTitle");
  const description = isOutdated
    ? t("home.nodeSetup.bannerOutdated", { version: nodeVersion })
    : t("home.nodeSetup.bannerDescription");
  const buttonLabel = isOutdated
    ? t("home.nodeSetup.updateButton")
    : t("home.nodeSetup.installButton");

  return (
    <div className="mb-6 flex w-full items-center gap-4 rounded-xl border border-amber-200 bg-amber-50 p-4 dark:border-amber-800 dark:bg-amber-950/30">
      <AlertTriangle className="size-5 shrink-0 text-amber-500" />

      <div className="min-w-0 flex-1">
        <h3 className="text-sm font-semibold text-amber-900 dark:text-amber-100">
          {title}
        </h3>
        <p className="mt-0.5 text-sm text-amber-700 dark:text-amber-300">
          {description}
        </p>
      </div>

      <Button
        variant="outline"
        className="shrink-0 border-amber-300 text-amber-900 hover:bg-amber-100 dark:border-amber-700 dark:text-amber-100 dark:hover:bg-amber-900/50"
        onClick={onInstallClick}
      >
        <Download />
        {buttonLabel}
      </Button>
    </div>
  );
}
