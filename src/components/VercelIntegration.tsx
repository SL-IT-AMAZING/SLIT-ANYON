import { Button } from "@/components/ui/button";
import { useSettings } from "@/hooks/useSettings";
import { showError, showSuccess } from "@/lib/toast";
import { useState } from "react";
import { useTranslation } from "react-i18next";

export function VercelIntegration() {
  const { t } = useTranslation(["app", "common"]);
  const { settings, updateSettings } = useSettings();
  const [isDisconnecting, setIsDisconnecting] = useState(false);

  const handleDisconnectFromVercel = async () => {
    setIsDisconnecting(true);
    try {
      const result = await updateSettings({
        vercelAccessToken: undefined,
      });
      if (result) {
        showSuccess(t("connect.vercel.disconnectSuccess"));
      } else {
        showError(t("connect.vercel.disconnectFailed"));
      }
    } catch (err: any) {
      showError(err.message || t("connect.vercel.disconnectError"));
    } finally {
      setIsDisconnecting(false);
    }
  };

  const isConnected = !!settings?.vercelAccessToken;

  if (!isConnected) {
    return null;
  }

  return (
    <div className="flex items-center justify-between">
      <div>
        <h3 className="text-sm font-medium text-muted-foreground">
          {t("connect.vercel.title")}
        </h3>
        <p className="text-xs text-muted-foreground mt-1">
          {t("connect.vercel.connectedDescription")}
        </p>
      </div>

      <Button
        onClick={handleDisconnectFromVercel}
        variant="destructive"
        size="sm"
        disabled={isDisconnecting}
        className="flex items-center gap-2"
      >
        {isDisconnecting
          ? t("connect.common.disconnecting")
          : t("connect.common.disconnect")}
        <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 24 24">
          <path d="M24 22.525H0l12-21.05 12 21.05z" />
        </svg>
      </Button>
    </div>
  );
}
