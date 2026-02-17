import { Button } from "@/components/ui/button";
import { useDeepLink } from "@/contexts/DeepLinkContext";
import { useTheme } from "@/contexts/ThemeContext";
import { useSettings } from "@/hooks/useSettings";
import { ipc } from "@/ipc/types";
import { oauthEndpoints } from "@/lib/oauthConfig";
import { isSupabaseConnected } from "@/lib/schemas";
import { ExternalLink } from "lucide-react";
import { useEffect } from "react";
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

  return (
    <div className="flex flex-col space-y-4 p-4 border bg-card max-w-100 rounded-md">
      <div className="flex flex-col items-start justify-between">
        <h2 className="text-lg font-medium pb-1">
          {t("connect.supabase.title")}
        </h2>
        <p className="text-sm text-muted-foreground pb-3">
          {t("connect.supabase.description")}
        </p>
        <img
          onClick={async () => {
            await ipc.system.openExternalUrl(oauthEndpoints.supabase.login);
          }}
          src={isDarkMode ? connectSupabaseDark : connectSupabaseLight}
          alt={t("connect.supabase.connectAlt")}
          className="h-10 cursor-pointer"
          data-testid="connect-supabase-hub-button"
        />
      </div>
    </div>
  );
}
