import type { ReactNode } from "react";
import { Globe } from "lucide-react";
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
  const query =
    queryProp ||
    node?.properties?.query ||
    (typeof children === "string" ? children : "");

  return (
    <ToolCallCard
      icon={Globe}
      title="Web Search"
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
