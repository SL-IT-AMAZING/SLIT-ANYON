import type { ReactNode } from "react";
import { Database } from "lucide-react";
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
  const content = typeof children === "string" ? children : "";

  return (
    <ToolCallCard
      icon={Database}
      title="Database Schema"
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
