import type { ReactNode } from "react";
import { Server } from "lucide-react";
import { ToolCallCard } from "./ToolCallCard";
import type { ToolCallStatus } from "./types";

interface SupabaseProjectInfoToolProps {
  node?: any;
  status?: ToolCallStatus;
  children?: ReactNode;
  className?: string;
}

export function SupabaseProjectInfoTool({
  node: _node,
  status,
  children,
  className,
}: SupabaseProjectInfoToolProps) {
  return (
    <ToolCallCard
      icon={Server}
      title="Supabase Project Info"
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
