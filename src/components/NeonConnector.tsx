import { Button } from "@/components/ui/button";
import { useSettings } from "@/hooks/useSettings";
import { ipc } from "@/ipc/types";
import { useEffect, useState } from "react";
import { toast } from "sonner";

import { NeonDisconnectButton } from "@/components/NeonDisconnectButton";
import { Input } from "@/components/ui/input";
import { useDeepLink } from "@/contexts/DeepLinkContext";
import { ExternalLink, Key } from "lucide-react";
import { useTranslation } from "react-i18next";

export function NeonConnector() {
  const { t } = useTranslation("app");
  const { settings, refreshSettings } = useSettings();
  const { lastDeepLink, clearLastDeepLink } = useDeepLink();

  useEffect(() => {
    const handleDeepLink = async () => {
      if (lastDeepLink?.type === "neon-oauth-return") {
        await refreshSettings();
        toast.success(t("connect.neon.connected"));
        clearLastDeepLink();
      }
    };
    handleDeepLink();
  }, [lastDeepLink?.timestamp]);

  if (settings?.neon?.accessToken) {
    return (
      <div className="flex flex-col space-y-4 p-4 border bg-white dark:bg-gray-800 max-w-100 rounded-md">
        <div className="flex flex-col items-start justify-between">
          <div className="flex items-center justify-between w-full">
            <h2 className="text-lg font-medium pb-1">
              {t("connect.neon.title")}
            </h2>
            <Button
              variant="outline"
              onClick={() => {
                ipc.system.openExternalUrl("https://console.neon.tech/");
              }}
              className="ml-2 px-2 py-1 h-8 mb-2 inline-flex items-center gap-1"
            >
              Neon
              <ExternalLink className="h-3 w-3" />
            </Button>
          </div>
          <p className="text-sm text-gray-500 dark:text-gray-400 pb-3">
            {t("connect.neon.connectedDescription")}
          </p>
          <NeonDisconnectButton />
        </div>
      </div>
    );
  }

  const [apiKey, setApiKey] = useState("");
  const [isConnecting, setIsConnecting] = useState(false);

  const handleApiKeyConnect = async () => {
    if (!apiKey.trim()) {
      toast.error(t("connect.neon.enterApiKey"));
      return;
    }

    setIsConnecting(true);
    try {
      await ipc.neon.connectWithApiKey({ apiKey: apiKey.trim() });
      await refreshSettings();
      toast.success(t("connect.neon.connected"));
      setApiKey("");
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      toast.error(message || t("connect.neon.connectFailed"));
    } finally {
      setIsConnecting(false);
    }
  };

  return (
    <div className="flex flex-col space-y-4 p-4 border bg-white dark:bg-gray-800 max-w-100 rounded-md">
      <div className="flex flex-col items-start justify-between">
        <h2 className="text-lg font-medium pb-1">{t("connect.neon.title")}</h2>
        <p className="text-sm text-gray-500 dark:text-gray-400 pb-3">
          {t("connect.neon.description")}
        </p>

        <div className="w-full space-y-3">
          <div className="flex gap-2">
            <Input
              type="password"
              placeholder={t("connect.neon.apiKeyPlaceholder")}
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  handleApiKeyConnect();
                }
              }}
              className="flex-1"
              data-testid="neon-api-key-input"
            />
            <Button
              onClick={handleApiKeyConnect}
              disabled={isConnecting || !apiKey.trim()}
              className="flex items-center gap-2"
              data-testid="connect-neon-button"
            >
              <Key className="h-4 w-4" />
              {isConnecting
                ? t("connect.common.connecting")
                : t("connect.common.connect")}
            </Button>
          </div>

          <p className="text-xs text-gray-400 dark:text-gray-500">
            {t("connect.neon.getApiKeyFrom")}{" "}
            <button
              type="button"
              onClick={() =>
                ipc.system.openExternalUrl(
                  "https://console.neon.tech/app/settings/api-keys",
                )
              }
              className="text-blue-500 hover:underline"
            >
              {t("connect.neon.apiKeyPath")}
            </button>
          </p>
        </div>
      </div>
    </div>
  );
}
