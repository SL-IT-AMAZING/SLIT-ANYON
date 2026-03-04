import { selectedAppIdAtom } from "@/atoms/appAtoms";
import { PreviewPanel } from "@/components/preview_panel/PreviewPanel";
import { Button } from "@/components/ui/button";
import { useParams, useRouter } from "@tanstack/react-router";
import { useSetAtom } from "jotai";
import { ArrowLeft } from "lucide-react";
import { useEffect } from "react";
import { useTranslation } from "react-i18next";

export default function AppDetailPage() {
  const { t } = useTranslation("app");
  const { appId } = useParams({ from: "/apps/$appId" });
  const router = useRouter();
  const setSelectedAppId = useSetAtom(selectedAppIdAtom);
  const numericAppId = Number(appId);

  useEffect(() => {
    if (!Number.isNaN(numericAppId)) {
      setSelectedAppId(numericAppId);
    }
  }, [numericAppId, setSelectedAppId]);

  return (
    <div className="flex flex-col h-full w-full">
      <div className="flex items-center px-4 py-2 border-b border-border">
        <Button
          onClick={() => router.history.back()}
          variant="ghost"
          size="sm"
          className="flex items-center gap-1.5 text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4" />
          {t("appDetail.back", { defaultValue: "Back" })}
        </Button>
      </div>
      <PreviewPanel minimal />
    </div>
  );
}
