import type { ReactNode } from "react";
import { useMemo } from "react";
import { Wrench } from "lucide-react";
import { ToolCallCard } from "./ToolCallCard";
import type { ToolCallStatus } from "./types";

interface McpToolResultToolProps {
  serverName?: string;
  toolName?: string;
  node?: any;
  status?: ToolCallStatus;
  children?: ReactNode;
  className?: string;
}

export function McpToolResultTool({
  serverName: serverNameProp,
  toolName: toolNameProp,
  node,
  status,
  children,
  className,
}: McpToolResultToolProps) {
  const serverName = serverNameProp || node?.properties?.serverName || "";
  const toolName = toolNameProp || node?.properties?.toolName || "";

  const subtitle = serverName ? `${serverName} → ${toolName}` : toolName;

  const raw = typeof children === "string" ? children : String(children ?? "");
  const prettyContent = useMemo(() => {
    if (!raw.trim()) return "";
    try {
      return JSON.stringify(JSON.parse(raw), null, 2);
    } catch {
      return raw;
    }
  }, [raw]);

  return (
    <ToolCallCard
      icon={Wrench}
      title="Tool Result"
      subtitle={subtitle || undefined}
      status={status}
      className={className}
    >
      {prettyContent && (
        <pre className="text-xs text-muted-foreground font-mono whitespace-pre-wrap max-h-60 overflow-y-auto">
          {prettyContent}
        </pre>
      )}
    </ToolCallCard>
  );
}
