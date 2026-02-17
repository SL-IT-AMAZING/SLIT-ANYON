import type { ReactNode } from "react";
import { Activity } from "lucide-react";
import { ToolCallCard } from "./ToolCallCard";
import type { ToolCallStatus } from "./types";

interface StatusToolProps {
  title?: string;
  node?: any;
  status?: ToolCallStatus;
  children?: ReactNode;
  className?: string;
}

export function StatusTool({
  title: titleProp,
  node,
  status,
  children,
  className,
}: StatusToolProps) {
  const title = titleProp || node?.properties?.title || "Processing...";
  const content = typeof children === "string" ? children : "";

  return (
    <ToolCallCard
      icon={Activity}
      title={title}
      status={status}
      className={className}
    >
      {content ? (
        <pre className="text-xs text-muted-foreground font-mono whitespace-pre-wrap max-h-60 overflow-y-auto">
          {content}
        </pre>
      ) : null}
    </ToolCallCard>
  );
}
