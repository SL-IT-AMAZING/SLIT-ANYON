import type { ReactNode } from "react";
import { Plug } from "lucide-react";
import { ToolCallCard } from "./ToolCallCard";
import type { ToolCallStatus } from "./types";

interface AddIntegrationToolProps {
  provider?: string;
  node?: any;
  status?: ToolCallStatus;
  children?: ReactNode;
  className?: string;
}

export function AddIntegrationTool({
  provider: providerProp,
  node,
  status,
  children,
  className,
}: AddIntegrationToolProps) {
  const provider = providerProp || node?.properties?.provider || undefined;

  return (
    <ToolCallCard
      icon={Plug}
      title="Add Integration"
      subtitle={provider}
      status={status}
      className={className}
    >
      {children && (
        <pre className="text-xs text-muted-foreground font-mono whitespace-pre-wrap max-h-60 overflow-y-auto">
          {children}
        </pre>
      )}
    </ToolCallCard>
  );
}
