import type { ReactNode } from "react";
import { Server } from "lucide-react";
import { useTranslation } from "react-i18next";
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
  const { t } = useTranslation("chat");
  return (
    <ToolCallCard
      icon={Server}
      title={t("tools.supabaseProjectInfo")}
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
