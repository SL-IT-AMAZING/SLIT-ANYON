import { Button } from "@/components/ui/button";
import { useDeepLink } from "@/contexts/DeepLinkContext";
import { useSettings } from "@/hooks/useSettings";
import { ipc } from "@/ipc/types";
import { oauthEndpoints } from "@/lib/oauthConfig";
import { ExternalLink } from "lucide-react";
import { useEffect } from "react";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";

export function VercelHubConnector() {
  const { t } = useTranslation("app");
  const { settings, refreshSettings, updateSettings } = useSettings();
  const { lastDeepLink, clearLastDeepLink } = useDeepLink();

  useEffect(() => {
    const handleDeepLink = async () => {
      if (lastDeepLink?.type === "vercel-oauth-return") {
        await refreshSettings();
        toast.success(t("connect.vercel.connected"));
        clearLastDeepLink();
      }
    };
    handleDeepLink();
  }, [lastDeepLink?.timestamp]);

  const isConnected =
    !!settings?.vercel?.accessToken || !!settings?.vercelAccessToken;

  if (isConnected) {
    return (
      <div className="flex flex-col space-y-4 p-4 border bg-card max-w-100 rounded-md">
        <div className="flex flex-col items-start justify-between">
          <div className="flex items-center justify-between w-full">
            <h2 className="text-lg font-medium pb-1">
              {t("connect.vercel.title")}
            </h2>
            <Button
              variant="outline"
              onClick={() => {
                ipc.system.openExternalUrl("https://vercel.com/dashboard");
              }}
              className="ml-2 px-2 py-1 h-8 mb-2 inline-flex items-center gap-1"
            >
              {t("connect.vercel.title")}
              <ExternalLink className="h-3 w-3" />
            </Button>
          </div>
          <p className="text-sm text-muted-foreground pb-3">
            {t("connect.vercel.connectedDescription")}
          </p>
          <Button
            variant="destructive"
            size="sm"
            onClick={async () => {
              await updateSettings({
                vercel: undefined,
                vercelAccessToken: undefined,
              });
              toast.success(t("connect.vercel.disconnected"));
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
          {t("connect.vercel.title")}
        </h2>
        <p className="text-sm text-muted-foreground pb-3">
          {t("connect.vercel.description")}
        </p>
        <div
          onClick={async () => {
            await ipc.system.openExternalUrl(oauthEndpoints.vercel.login);
          }}
          className="w-auto h-10 cursor-pointer flex items-center justify-center px-4 py-2 rounded-md border-2 transition-colors font-medium text-sm dark:bg-muted dark:border-border"
          data-testid="connect-vercel-hub-button"
        >
          <span className="mr-2">{t("connect.vercel.connectPrefix")}</span>
          <VercelSvg />
        </div>
      </div>
    </div>
  );
}

function VercelSvg() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="72"
      height="16"
      viewBox="0 0 284 65"
      className="dark:fill-white fill-black"
    >
      <path d="M141.68 16.25c-11.04 0-19 7.2-19 18s8.96 18 20 18c6.67 0 12.55-2.64 16.19-7.09l-7.65-4.42c-2.02 2.21-5.09 3.5-8.54 3.5-4.79 0-8.86-2.5-10.37-6.5h28.02c.22-1.12.35-2.28.35-3.5 0-10.79-7.96-17.99-19-17.99zm-9.46 14.5c1.25-3.99 4.67-6.5 9.45-6.5 4.79 0 8.21 2.51 9.45 6.5h-18.9zm-39.04-14.5c-11.04 0-19 7.2-19 18s8.96 18 20 18c6.67 0 12.55-2.64 16.19-7.09l-7.65-4.42c-2.02 2.21-5.09 3.5-8.54 3.5-4.79 0-8.86-2.5-10.37-6.5h28.02c.22-1.12.35-2.28.35-3.5 0-10.79-7.96-17.99-19-17.99zm-9.45 14.5c1.25-3.99 4.67-6.5 9.45-6.5 4.79 0 8.21 2.51 9.45 6.5h-18.9zm-34.27-14.5c-6.44 0-10.69 2.89-13.22 6.18V16.25h-9.85V62.7h9.85V45.13c0-6.26 4.21-10.38 9.57-10.38 5.23 0 8.75 3.87 8.75 9.63V62.7h9.85V42.39c0-12.21-7.37-20.14-17.95-20.14L49.92 22.25zm162.28 0c-11.04 0-19 7.2-19 18s8.96 18 20 18c6.67 0 12.55-2.64 16.19-7.09l-7.65-4.42c-2.02 2.21-5.09 3.5-8.54 3.5-4.79 0-8.86-2.5-10.37-6.5h28.02c.22-1.12.35-2.28.35-3.5 0-10.79-7.96-17.99-19-17.99zm-9.45 14.5c1.25-3.99 4.67-6.5 9.45-6.5 4.79 0 8.21 2.51 9.45 6.5h-18.9zm-38.28-14.5c-11.04 0-19 7.2-19 18s8.96 18 20 18c6.67 0 12.55-2.64 16.19-7.09l-7.65-4.42c-2.02 2.21-5.09 3.5-8.54 3.5-4.79 0-8.86-2.5-10.37-6.5h28.02c.22-1.12.35-2.28.35-3.5 0-10.79-7.96-17.99-19-17.99zm-9.45 14.5c1.25-3.99 4.67-6.5 9.45-6.5 4.79 0 8.21 2.51 9.45 6.5h-18.9zM35.02 0L0 62.7h13.2L35.02 14.39 56.84 62.7H70.04L35.02 0zm184.38 16.25h-9.85v7.95h-5.64v7.95h5.64v21.1c0 9.41 5.43 11.77 13.31 11.77 2.53 0 5.33-.45 7.37-1.35v-8.18c-1.7.67-3.66 1.02-5.59 1.02-3.43 0-5.24-1.21-5.24-5.01V32.15h10.83v-7.95h-10.83v-7.95zm38.76 0c-6.44 0-10.69 2.89-13.22 6.18V1.63h-9.85V62.7h9.85V45.13c0-6.26 4.21-10.38 9.57-10.38 5.23 0 8.75 3.87 8.75 9.63V62.7h9.85V42.39c0-12.21-7.37-20.14-17.95-20.14l3 5.75z" />
    </svg>
  );
}
