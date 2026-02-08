import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { ipc } from "@/ipc/types";
import { toast } from "sonner";
import { useSettings } from "@/hooks/useSettings";

import { useDeepLink } from "@/contexts/DeepLinkContext";
import { ExternalLink, Key } from "lucide-react";
import { NeonDisconnectButton } from "@/components/NeonDisconnectButton";
import { Input } from "@/components/ui/input";

export function NeonConnector() {
  const { settings, refreshSettings } = useSettings();
  const { lastDeepLink, clearLastDeepLink } = useDeepLink();

  useEffect(() => {
    const handleDeepLink = async () => {
      if (lastDeepLink?.type === "neon-oauth-return") {
        await refreshSettings();
        toast.success("Successfully connected to Neon!");
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
            <h2 className="text-lg font-medium pb-1">Neon Database</h2>
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
            You are connected to Neon Database
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
      toast.error("Please enter your Neon API key");
      return;
    }

    setIsConnecting(true);
    try {
      await ipc.neon.connectWithApiKey({ apiKey: apiKey.trim() });
      await refreshSettings();
      toast.success("Successfully connected to Neon!");
      setApiKey("");
    } catch (error: any) {
      toast.error(error.message || "Failed to connect to Neon");
    } finally {
      setIsConnecting(false);
    }
  };

  return (
    <div className="flex flex-col space-y-4 p-4 border bg-white dark:bg-gray-800 max-w-100 rounded-md">
      <div className="flex flex-col items-start justify-between">
        <h2 className="text-lg font-medium pb-1">Neon Database</h2>
        <p className="text-sm text-gray-500 dark:text-gray-400 pb-3">
          Neon Database has a good free tier with backups and up to 10 projects.
        </p>

        <div className="w-full space-y-3">
          <div className="flex gap-2">
            <Input
              type="password"
              placeholder="Enter your Neon API key"
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
              {isConnecting ? "Connecting..." : "Connect"}
            </Button>
          </div>

          <p className="text-xs text-gray-400 dark:text-gray-500">
            Get your API key from{" "}
            <button
              type="button"
              onClick={() =>
                ipc.system.openExternalUrl(
                  "https://console.neon.tech/app/settings/api-keys",
                )
              }
              className="text-blue-500 hover:underline"
            >
              Neon Console → Account Settings → API Keys
            </button>
          </p>
        </div>
      </div>
    </div>
  );
}
