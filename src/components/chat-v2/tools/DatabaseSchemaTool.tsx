import type { ReactNode } from "react";
import { Database } from "lucide-react";
import { useTranslation } from "react-i18next";
import { ToolCallCard } from "./ToolCallCard";
import type { ToolCallStatus } from "./types";

interface DatabaseSchemaToolProps {
  node?: any;
  status?: ToolCallStatus;
  children?: ReactNode;
  className?: string;
}

export function DatabaseSchemaTool({
  node: _node,
  status,
  children,
  className,
}: DatabaseSchemaToolProps) {
  const { t } = useTranslation("chat");
  const content = typeof children === "string" ? children : "";

  return (
    <ToolCallCard
      icon={Database}
      title={t("tools.databaseSchema")}
      status={status}
      className={className}
    >
      {content && (
        <pre className="text-xs text-muted-foreground font-mono whitespace-pre-wrap max-h-60 overflow-y-auto">
          {content}
        </pre>
      )}
    </ToolCallCard>
  );
}
