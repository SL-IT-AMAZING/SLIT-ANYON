import type { ReactNode } from "react";
import { Eye } from "lucide-react";
import { ToolCallCard } from "./ToolCallCard";
import type { ToolCallStatus } from "./types";

interface ReadToolProps {
  path?: string;
  node?: any;
  status?: ToolCallStatus;
  children?: ReactNode;
  className?: string;
}

export function ReadTool({
  path: pathProp,
  node,
  status,
  children,
  className,
}: ReadToolProps) {
  const path = pathProp || node?.properties?.path || "";
  const fileName = path ? path.split("/").pop() : "";

  return (
    <ToolCallCard
      icon={Eye}
      title="Read"
      subtitle={fileName || undefined}
      status={status}
      metadata={path ? [{ label: "path", value: path }] : undefined}
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
