import { NeonDisconnectButton } from "@/components/NeonDisconnectButton";
import { useSettings } from "@/hooks/useSettings";

export function NeonIntegration() {
  const { settings } = useSettings();

  const isConnected = !!settings?.neon?.accessToken;

  if (!isConnected) {
    return null;
  }

  return (
    <div className="flex items-center justify-between">
      <div>
        <h3 className="text-sm font-medium text-muted-foreground">
          Neon Integration
        </h3>
        <p className="text-xs text-muted-foreground mt-1">
          Your account is connected to Neon.
        </p>
      </div>

      <div className="flex items-center gap-2">
        <NeonDisconnectButton />
      </div>
    </div>
  );
}
