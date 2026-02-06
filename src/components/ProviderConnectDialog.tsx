import { CheckCircle2, CircleSlash, Terminal } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "./ui/dialog";
import { Badge } from "./ui/badge";
import { ScrollArea } from "./ui/scroll-area";
import { useLanguageModelProviders } from "@/hooks/useLanguageModelProviders";
import type { LanguageModelProvider } from "@/ipc/types";

interface ProviderConnectDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

function ProviderItem({ provider }: { provider: LanguageModelProvider }) {
  const isConnected = provider.isConnected ?? false;

  return (
    <div className="flex items-start justify-between gap-4 rounded-lg border bg-card p-4">
      <div className="flex-1 space-y-2">
        <div className="flex items-center gap-2">
          <span className="font-medium">{provider.name}</span>
          {isConnected ? (
            <Badge className="bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border-emerald-500/20 hover:bg-emerald-500/15">
              <CheckCircle2 className="mr-1 h-3 w-3" />
              Connected
            </Badge>
          ) : (
            <Badge
              variant="secondary"
              className="bg-muted text-muted-foreground"
            >
              <CircleSlash className="mr-1 h-3 w-3" />
              Not connected
            </Badge>
          )}
        </div>

        {!isConnected && (
          <div className="flex items-start gap-2 rounded-md bg-muted/50 p-3 text-sm text-muted-foreground">
            <Terminal className="mt-0.5 h-4 w-4 shrink-0" />
            <div className="space-y-1">
              <p>Set up via OpenCode CLI:</p>
              <code className="block rounded bg-background px-2 py-1 font-mono text-xs">
                opencode config set provider.{provider.id}
              </code>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export function ProviderConnectDialog({
  open,
  onOpenChange,
}: ProviderConnectDialogProps) {
  const { data: providers, isLoading } = useLanguageModelProviders();

  const connectedCount = providers?.filter((p) => p.isConnected).length ?? 0;
  const totalCount = providers?.length ?? 0;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Provider Connections</DialogTitle>
          <DialogDescription>
            {totalCount > 0
              ? `${connectedCount} of ${totalCount} providers connected`
              : "Manage your AI provider connections"}
          </DialogDescription>
        </DialogHeader>

        <ScrollArea className="max-h-[60vh]">
          <div className="space-y-3 pr-4">
            {isLoading ? (
              <div className="flex items-center justify-center py-8 text-muted-foreground">
                Loading providers...
              </div>
            ) : providers && providers.length > 0 ? (
              providers.map((provider) => (
                <ProviderItem key={provider.id} provider={provider} />
              ))
            ) : (
              <div className="flex items-center justify-center py-8 text-muted-foreground">
                No providers available
              </div>
            )}
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}
