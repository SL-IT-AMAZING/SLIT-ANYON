import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { ipc } from "@/ipc/types";
import { toast } from "sonner";
import { useSettings } from "@/hooks/useSettings";
import { useDeepLink } from "@/contexts/DeepLinkContext";
import { ExternalLink } from "lucide-react";
import { useTheme } from "@/contexts/ThemeContext";
import { isSupabaseConnected } from "@/lib/schemas";

import supabaseLogoLight from "../../assets/supabase/supabase-logo-wordmark--light.svg";
import supabaseLogoDark from "../../assets/supabase/supabase-logo-wordmark--dark.svg";
import connectSupabaseDark from "../../assets/supabase/connect-supabase-dark.svg";
import connectSupabaseLight from "../../assets/supabase/connect-supabase-light.svg";

export function SupabaseHubConnector() {
  const { settings, refreshSettings, updateSettings } = useSettings();
  const { lastDeepLink, clearLastDeepLink } = useDeepLink();
  const { isDarkMode } = useTheme();

  useEffect(() => {
    const handleDeepLink = async () => {
      if (lastDeepLink?.type === "supabase-oauth-return") {
        await refreshSettings();
        toast.success("Successfully connected to Supabase!");
        clearLastDeepLink();
      }
    };
    handleDeepLink();
  }, [lastDeepLink?.timestamp]);

  const isConnected = isSupabaseConnected(settings);

  if (isConnected) {
    return (
      <div className="flex flex-col space-y-4 p-4 border bg-white dark:bg-gray-800 max-w-100 rounded-md">
        <div className="flex flex-col items-start justify-between">
          <div className="flex items-center justify-between w-full">
            <h2 className="text-lg font-medium pb-1">Supabase</h2>
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
          <p className="text-sm text-gray-500 dark:text-gray-400 pb-3">
            You are connected to Supabase
          </p>
          <Button
            variant="destructive"
            size="sm"
            onClick={async () => {
              await updateSettings({
                supabase: undefined,
                enableSupabaseWriteSqlMigration: false,
              });
              toast.success("Disconnected from Supabase");
            }}
          >
            Disconnect
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col space-y-4 p-4 border bg-white dark:bg-gray-800 max-w-100 rounded-md">
      <div className="flex flex-col items-start justify-between">
        <h2 className="text-lg font-medium pb-1">Supabase</h2>
        <p className="text-sm text-gray-500 dark:text-gray-400 pb-3">
          Supabase provides auth, database, storage and more with a generous
          free tier.
        </p>
        <img
          onClick={async () => {
            await ipc.system.openExternalUrl(
              "https://supabase-oauth.dyad.sh/api/connect-supabase/login",
            );
          }}
          src={isDarkMode ? connectSupabaseDark : connectSupabaseLight}
          alt="Connect to Supabase"
          className="h-10 cursor-pointer"
          data-testid="connect-supabase-hub-button"
        />
      </div>
    </div>
  );
}
