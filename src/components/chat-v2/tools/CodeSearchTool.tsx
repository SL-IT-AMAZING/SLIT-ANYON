import type { ReactNode } from "react";
import { Search } from "lucide-react";
import { useTranslation } from "react-i18next";
import { ToolCallCard } from "./ToolCallCard";
import type { ToolCallStatus } from "./types";

interface CodeSearchToolProps {
  query?: string;
  node?: any;
  status?: ToolCallStatus;
  children?: ReactNode;
  className?: string;
}

export function CodeSearchTool({
  query: queryProp,
  node,
  status,
  children,
  className,
}: CodeSearchToolProps) {
  const { t } = useTranslation("chat");
  const query = queryProp || node?.properties?.query || "";

  return (
    <ToolCallCard
      icon={Search}
      title={t("tools.codeSearch")}
      subtitle={query ? `"${query}"` : undefined}
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
