import ConfirmationDialog from "@/components/ConfirmationDialog";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { useSettings } from "@/hooks/useSettings";
import { ipc } from "@/ipc/types";
import { showError, showSuccess } from "@/lib/toast";
import { useState } from "react";
import { useTranslation } from "react-i18next";

export function ExperimentsPanel() {
  const { t } = useTranslation(["app", "settings", "common"]);
  const { settings, updateSettings } = useSettings();
  const [isResetDialogOpen, setIsResetDialogOpen] = useState(false);
  const [isResetting, setIsResetting] = useState(false);

  const handleResetEverything = async () => {
    setIsResetting(true);
    try {
      await ipc.system.resetAll();
      showSuccess(t("dangerZone.resetSuccess", { ns: "settings" }));
    } catch (error) {
      console.error("Error resetting:", error);
      showError(
        error instanceof Error
          ? error.message
          : t("errors.generic", { ns: "common" }),
      );
    } finally {
      setIsResetting(false);
      setIsResetDialogOpen(false);
    }
  };

  return (
    <div className="space-y-6">
      <h2 className="text-lg font-semibold text-foreground">
        {t("settings.tabs.experiments")}
      </h2>

      <div className="space-y-4">
        <div className="space-y-1">
          <div className="flex items-center space-x-2">
            <Switch
              id="enable-native-git"
              aria-label={t("experiments.nativeGit", { ns: "settings" })}
              checked={!!settings?.enableNativeGit}
              onCheckedChange={(checked) => {
                updateSettings({
                  enableNativeGit: checked,
                });
              }}
            />
            <Label htmlFor="enable-native-git">
              {t("experiments.nativeGit", { ns: "settings" })}
            </Label>
          </div>
          <div className="text-sm text-muted-foreground">
            {t("experiments.nativeGitDescription", { ns: "settings" })}
          </div>
        </div>
      </div>

      <div className="rounded-lg border border-red-200 p-4 dark:border-red-800">
        <h3 className="text-sm font-medium text-red-600 dark:text-red-400 mb-3">
          {t("sections.dangerZone", { ns: "settings" })}
        </h3>
        <div className="flex items-start justify-between flex-col sm:flex-row sm:items-center gap-4">
          <div>
            <h4 className="text-sm font-medium text-foreground">
              {t("dangerZone.deleteData", { ns: "settings" })}
            </h4>
            <p className="text-xs text-muted-foreground mt-1">
              {t("dangerZone.deleteDataDescription", { ns: "settings" })}
            </p>
          </div>
          <button
            onClick={() => setIsResetDialogOpen(true)}
            disabled={isResetting}
            className="shrink-0 rounded-md border border-transparent bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isResetting
              ? t("dangerZone.resetting", { ns: "settings" })
              : t("dangerZone.deleteData", { ns: "settings" })}
          </button>
        </div>
      </div>

      <ConfirmationDialog
        isOpen={isResetDialogOpen}
        title={t("dangerZone.deleteData", { ns: "settings" })}
        message={t("dangerZone.deleteDataConfirm", { ns: "settings" })}
        confirmText={t("dangerZone.deleteData", { ns: "settings" })}
        cancelText={t("buttons.cancel", { ns: "common" })}
        onConfirm={handleResetEverything}
        onCancel={() => setIsResetDialogOpen(false)}
      />
    </div>
  );
}
