import { Button } from "@/components/ui/button";
import { useSettings } from "@/hooks/useSettings";
import { ipc } from "@/ipc/types";
import { ExternalLink } from "lucide-react";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";

export function VercelHubConnector() {
  const { t } = useTranslation("app");
  const { settings, refreshSettings, updateSettings } = useSettings();

  const [deviceAuthState, setDeviceAuthState] = useState<{
    userCode: string;
    interval: number;
  } | null>(null);
  const [isConnecting, setIsConnecting] = useState(false);
  const [connectError, setConnectError] = useState<string | null>(null);


  useEffect(() => {
    if (!deviceAuthState) {
      return;
    }

    let isMounted = true;
    let isPolling = false;
    const poll = async () => {
      if (isPolling || !isMounted) return;
      isPolling = true;
      try {
        const result = await ipc.vercel.pollDeviceAuth();
        if (!isMounted) return;

        if (result.status === "success") {
          setDeviceAuthState(null);
          setIsConnecting(false);
          setConnectError(null);
          await refreshSettings();
          toast.success(t("connect.vercel.connected"));
          return;
        }

        if (result.status === "expired") {
          setDeviceAuthState(null);
          setIsConnecting(false);
          setConnectError("Device authorization expired. Please try again.");
          return;
        }

        if (result.status === "denied") {
          setDeviceAuthState(null);
          setIsConnecting(false);
          setConnectError("Authorization was denied. Please try again.");
          return;
        }

        if (result.status === "error") {
          setDeviceAuthState(null);
          setIsConnecting(false);
          setConnectError(
            result.error || "Failed to complete Vercel device authorization.",
          );
        }
      } catch (error) {
        if (!isMounted) return;
        setDeviceAuthState(null);
        setIsConnecting(false);
        setConnectError(
          error instanceof Error
            ? error.message
            : "Failed to poll Vercel authorization status.",
        );
      } finally {
        isPolling = false;
      }
    };

    const intervalId = setInterval(poll, deviceAuthState.interval * 1000);
    return () => {
      isMounted = false;
      clearInterval(intervalId);
    };
  }, [deviceAuthState, refreshSettings, t]);

  const handleStartDeviceAuth = async () => {
    setConnectError(null);
    setIsConnecting(true);

    try {
      const start = await ipc.vercel.startDeviceAuth();
      setDeviceAuthState({
        userCode: start.userCode,
        interval: start.interval,
      });
      await ipc.system.openExternalUrl(start.verificationUriComplete);
    } catch (error) {
      setIsConnecting(false);
      setDeviceAuthState(null);
      setConnectError(
        error instanceof Error
          ? error.message
          : "Failed to start Vercel device authorization.",
      );
    }
  };

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

        <Button
          onClick={handleStartDeviceAuth}
          variant="outline"
          className="w-auto h-10 inline-flex items-center gap-2"
          disabled={isConnecting}
          data-testid="connect-vercel-hub-button"
        >
          {deviceAuthState ? (
            <>
              <svg
                className="h-4 w-4 animate-spin"
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
              >
                <circle
                  className="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="4"
                />
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
                />
              </svg>
              {`Enter code: ${deviceAuthState.userCode}`}
            </>
          ) : isConnecting ? (
            "Opening browser..."
          ) : (
            <>
              <span>{t("connect.vercel.connectPrefix")}</span>
              <VercelSvg />
            </>
          )}
        </Button>

        {deviceAuthState && (
          <div className="mt-3 rounded-md border border-border bg-muted/40 p-3 w-full max-w-100">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <svg
                className="h-4 w-4 animate-spin"
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
              >
                <circle
                  className="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="4"
                />
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
                />
              </svg>
              Waiting for authorization...
            </div>
            <p className="mt-2 text-xs text-muted-foreground">
              Enter this code in your browser:
            </p>
            <p className="mt-1 font-mono text-lg font-semibold tracking-wider">
              {deviceAuthState.userCode}
            </p>
          </div>
        )}

        {connectError && (
          <div className="mt-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-md p-3 w-full max-w-100">
            <p className="text-sm text-red-800 dark:text-red-200">
              {connectError}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

function VercelSvg() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      aria-label="Vercel logo"
      role="img"
      width="72"
      height="16"
      viewBox="0 0 283 64"
      className="dark:fill-white fill-black"
    >
      <path d="M141.68 16.25c-11.04 0-19 7.2-19 18s8.96 18 20 18c6.67 0 12.55-2.64 16.19-7.09l-7.65-4.42c-2.02 2.21-5.09 3.5-8.54 3.5-4.79 0-8.86-2.5-10.37-6.5h28.02c.22-1.12.35-2.28.35-3.5 0-10.79-7.96-17.99-19-17.99zm-9.46 14.5c1.25-3.99 4.67-6.5 9.45-6.5 4.79 0 8.21 2.51 9.45 6.5h-18.9zm117.14-14.5c-11.04 0-19 7.2-19 18s8.96 18 20 18c6.67 0 12.55-2.64 16.19-7.09l-7.65-4.42c-2.02 2.21-5.09 3.5-8.54 3.5-4.79 0-8.86-2.5-10.37-6.5h28.02c.22-1.12.35-2.28.35-3.5 0-10.79-7.96-17.99-19-17.99zm-9.45 14.5c1.25-3.99 4.67-6.5 9.45-6.5 4.79 0 8.21 2.51 9.45 6.5h-18.9zm-39.03 3.5c0 6 3.92 10 10 10 4.12 0 7.21-1.87 8.8-4.92l7.68 4.43c-3.18 5.3-9.14 8.49-16.48 8.49-11.05 0-19-7.2-19-18s7.96-18 19-18c7.34 0 13.29 3.19 16.48 8.49l-7.68 4.43c-1.59-3.05-4.68-4.92-8.8-4.92-6.07 0-10 4-10 10zm82.48-29v46h-9v-46h9zM37.59.25l36.95 64H.64l36.95-64zm92.38 5l-27.71 48-27.71-48h10.39l17.32 30 17.32-30h10.39zm58.91 12v9.69c-1-.29-2.06-.49-3.2-.49-5.81 0-10 4-10 10v14.8h-9v-34h9v9.2c0-5.08 5.91-9.2 13.2-9.2z" />
    </svg>
  );
}
