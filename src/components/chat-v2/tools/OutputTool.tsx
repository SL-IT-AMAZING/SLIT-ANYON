import type { ReactNode } from "react";
import { AlertTriangle } from "lucide-react";
import { ToolCallCard } from "./ToolCallCard";

interface OutputToolProps {
  type?: "error" | "warning";
  message?: string;
  children?: ReactNode;
  className?: string;
}

export function OutputTool({
  type,
  message,
  children,
  className,
}: OutputToolProps) {
  const title = type === "warning" ? "Warning" : "Error";
  const subtitle =
    message && message.length > 100
      ? `${message.slice(0, 100)}...`
      : message || undefined;
  const status = type !== "warning" ? ("error" as const) : undefined;
  const childrenText = typeof children === "string" ? children : "";
  const fullContent = [message, childrenText].filter(Boolean).join("\n");

  return (
    <ToolCallCard
      icon={AlertTriangle}
      title={title}
      subtitle={subtitle}
      status={status}
      className={className}
    >
      {fullContent ? (
        <pre className="text-xs text-muted-foreground font-mono whitespace-pre-wrap max-h-60 overflow-y-auto">
          {fullContent}
        </pre>
      ) : null}
    </ToolCallCard>
  );
}
