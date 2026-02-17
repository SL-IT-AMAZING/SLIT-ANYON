import type { ReactNode } from "react";
import { Database } from "lucide-react";
import { ToolCallCard } from "./ToolCallCard";
import type { ToolCallStatus } from "./types";

interface ExecuteSqlToolProps {
  description?: string;
  node?: any;
  status?: ToolCallStatus;
  children?: ReactNode;
  className?: string;
}

export function ExecuteSqlTool({
  description: descriptionProp,
  node,
  status,
  children,
  className,
}: ExecuteSqlToolProps) {
  const description =
    descriptionProp || node?.properties?.description || undefined;

  return (
    <ToolCallCard
      icon={Database}
      title="SQL"
      subtitle={description}
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
