import type { ReactNode } from "react";
import { Globe } from "lucide-react";
import { useTranslation } from "react-i18next";
import { ToolCallCard } from "./ToolCallCard";
import type { ToolCallStatus } from "./types";

interface WebSearchToolProps {
  query?: string;
  node?: any;
  status?: ToolCallStatus;
  children?: ReactNode;
  className?: string;
}

export function WebSearchTool({
  query: queryProp,
  node,
  status,
  children,
  className,
}: WebSearchToolProps) {
  const { t } = useTranslation("chat");
  const query =
    queryProp ||
    node?.properties?.query ||
    (typeof children === "string" ? children : "");

  return (
    <ToolCallCard
      icon={Globe}
      title={t("tools.webSearch")}
      subtitle={query || undefined}
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
