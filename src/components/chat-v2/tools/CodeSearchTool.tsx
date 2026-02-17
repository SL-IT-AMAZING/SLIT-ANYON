import type { ReactNode } from "react";
import { Search } from "lucide-react";
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
  const query = queryProp || node?.properties?.query || "";

  return (
    <ToolCallCard
      icon={Search}
      title="Code Search"
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
