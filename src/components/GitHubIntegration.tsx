import { Button } from "@/components/ui/button";
import { useSettings } from "@/hooks/useSettings";
import { showError, showSuccess } from "@/lib/toast";
import { Github } from "lucide-react";
import { useState } from "react";
import { useTranslation } from "react-i18next";

export function GitHubIntegration() {
  const { t } = useTranslation("app");
  const { settings, updateSettings } = useSettings();
  const [isDisconnecting, setIsDisconnecting] = useState(false);

  const handleDisconnectFromGithub = async () => {
    setIsDisconnecting(true);
    try {
      const result = await updateSettings({
        githubAccessToken: undefined,
        githubUser: undefined,
      });
      if (result) {
        showSuccess(t("connect.github.disconnectSuccess"));
      } else {
        showError(t("connect.github.disconnectFailed"));
      }
    } catch (err: any) {
      showError(err.message || t("connect.github.disconnectError"));
    } finally {
      setIsDisconnecting(false);
    }
  };

  const isConnected = !!settings?.githubAccessToken;

  if (!isConnected) {
    return null;
  }

  return (
    <div className="flex items-center justify-between">
      <div>
        <h3 className="text-sm font-medium text-muted-foreground">
          {t("connect.github.integration")}
        </h3>
        <p className="text-xs text-muted-foreground mt-1">
          {t("connect.github.accountConnected")}
        </p>
      </div>

      <Button
        onClick={handleDisconnectFromGithub}
        variant="destructive"
        size="sm"
        disabled={isDisconnecting}
        className="flex items-center gap-2"
      >
        {isDisconnecting
          ? t("buttons.disconnecting", { ns: "common" })
          : t("connect.github.disconnectFromGithub")}
        <Github className="h-4 w-4" />
      </Button>
    </div>
  );
}
