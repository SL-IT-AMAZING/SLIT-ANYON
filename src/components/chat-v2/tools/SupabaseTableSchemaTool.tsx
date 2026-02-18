import type { ReactNode } from "react";
import { Table } from "lucide-react";
import { useTranslation } from "react-i18next";
import { ToolCallCard } from "./ToolCallCard";
import type { ToolCallStatus } from "./types";

interface SupabaseTableSchemaToolProps {
  table?: string;
  node?: any;
  status?: ToolCallStatus;
  children?: ReactNode;
  className?: string;
}

export function SupabaseTableSchemaTool({
  table: tableProp,
  node,
  status,
  children,
  className,
}: SupabaseTableSchemaToolProps) {
  const { t } = useTranslation("chat");
  const table = tableProp || node?.properties?.table || undefined;

  return (
    <ToolCallCard
      icon={Table}
      title={t("tools.tableSchema")}
      subtitle={table}
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
