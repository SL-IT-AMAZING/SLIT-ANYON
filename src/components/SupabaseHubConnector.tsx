import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { useDeepLink } from "@/contexts/DeepLinkContext";
import { useTheme } from "@/contexts/ThemeContext";
import { useSettings } from "@/hooks/useSettings";
import { ipc } from "@/ipc/types";
import { oauthEndpoints } from "@/lib/oauthConfig";
import { isSupabaseConnected } from "@/lib/schemas";
import { AlertCircle, ExternalLink } from "lucide-react";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";

import connectSupabaseDark from "../../assets/supabase/connect-supabase-dark.svg";
import connectSupabaseLight from "../../assets/supabase/connect-supabase-light.svg";
import supabaseLogoDark from "../../assets/supabase/supabase-logo-wordmark--dark.svg";
import supabaseLogoLight from "../../assets/supabase/supabase-logo-wordmark--light.svg";

export function SupabaseHubConnector() {
  const { t } = useTranslation("app");
  const { settings, refreshSettings, updateSettings } = useSettings();
  const { lastDeepLink, clearLastDeepLink } = useDeepLink();
  const { isDarkMode } = useTheme();
  const [oauthError, setOauthError] = useState<string | null>(null);

  useEffect(() => {
    const handleDeepLink = async () => {
      if (lastDeepLink?.type === "supabase-oauth-return") {
        await refreshSettings();
        toast.success(t("connect.supabase.connected"));
        clearLastDeepLink();
      }
    };
    handleDeepLink();
  }, [lastDeepLink?.timestamp]);

  const isConnected = isSupabaseConnected(settings);

  if (isConnected) {
    return (
      <div className="flex flex-col space-y-4 p-4 border bg-card max-w-100 rounded-md">
        <div className="flex flex-col items-start justify-between">
          <div className="flex items-center justify-between w-full">
            <h2 className="text-lg font-medium pb-1">
              {t("connect.supabase.title")}
            </h2>
            <Button
              variant="outline"
              onClick={() => {
                ipc.system.openExternalUrl(
                  "https://supabase.com/dashboard/projects",
                );
              }}
              className="ml-2 px-2 py-1 h-8 mb-2 inline-flex items-center gap-1"
            >
              <img
                src={isDarkMode ? supabaseLogoDark : supabaseLogoLight}
                alt="Supabase"
                className="h-4"
              />
              <ExternalLink className="h-3 w-3" />
            </Button>
          </div>
          <p className="text-sm text-muted-foreground pb-3">
            {t("connect.supabase.connectedDescription")}
          </p>
          <Button
            variant="destructive"
            size="sm"
            onClick={async () => {
              await updateSettings({
                supabase: undefined,
                enableSupabaseWriteSqlMigration: false,
              });
              toast.success(t("connect.supabase.disconnected"));
            }}
          >
            {t("connect.common.disconnect")}
          </Button>
        </div>
      </div>
    );
  }

  const handleConnect = async () => {
    setOauthError(null);
    try {
      await ipc.system.openExternalUrl(oauthEndpoints.supabase.login);
    } catch (error) {
      const message =
        error instanceof Error ? error.message : String(error);
      setOauthError(message);
    }
  };

  return (
    <div className="flex flex-col space-y-4 p-4 border bg-card max-w-100 rounded-md">
      <div className="flex flex-col items-start justify-between">
        <h2 className="text-lg font-medium pb-1">
          {t("connect.supabase.title")}
        </h2>
        <p className="text-sm text-muted-foreground pb-3">
          {t("connect.supabase.description")}
        </p>
        {oauthError && (
          <Alert variant="destructive" className="mb-3">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>{t("connect.supabase.errorTitle", "Connection failed")}</AlertTitle>
            <AlertDescription className="flex flex-col gap-2">
              <span>{oauthError}</span>
              <Button
                variant="outline"
                size="sm"
                className="w-fit"
                onClick={handleConnect}
              >
                {t("connect.supabase.tryAgain", "Try Again")}
              </Button>
            </AlertDescription>
          </Alert>
        )}
        <button
          type="button"
          onClick={handleConnect}
          className="h-10 cursor-pointer bg-transparent border-0 p-0"
          data-testid="connect-supabase-hub-button"
        >
          <img
            src={isDarkMode ? connectSupabaseDark : connectSupabaseLight}
            alt={t("connect.supabase.connectAlt")}
            className="h-10"
          />
        </button>
      </div>
    </div>
  );
}
