import type { ReactNode } from "react";
import { Trash2 } from "lucide-react";
import { ToolCallCard } from "./ToolCallCard";
import type { ToolCallStatus } from "./types";

interface DeleteToolProps {
  path?: string;
  node?: any;
  status?: ToolCallStatus;
  children?: ReactNode;
  className?: string;
}

export function DeleteTool({
  path: pathProp,
  node,
  status,
  children,
  className,
}: DeleteToolProps) {
  const path = pathProp || node?.properties?.path || "";
  const fileName = path ? path.split("/").pop() : "";

  return (
    <ToolCallCard
      icon={Trash2}
      title="Delete"
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
