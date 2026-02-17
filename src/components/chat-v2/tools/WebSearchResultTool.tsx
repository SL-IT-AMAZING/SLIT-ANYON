import type { ReactNode } from "react";
import { Globe } from "lucide-react";
import { ToolCallCard } from "./ToolCallCard";
import type { ToolCallStatus } from "./types";

interface WebSearchResultToolProps {
  node?: any;
  status?: ToolCallStatus;
  children?: ReactNode;
  className?: string;
}

export function WebSearchResultTool({
  node: _node,
  status,
  children,
  className,
}: WebSearchResultToolProps) {
  return (
    <ToolCallCard
      icon={Globe}
      title="Web Search Result"
      status={status}
      defaultExpanded={status === "running"}
      className={className}
    >
      {children && (
        <div className="text-sm text-muted-foreground">
          {typeof children === "string" ? children : children}
        </div>
      )}
    </ToolCallCard>
  );
}
