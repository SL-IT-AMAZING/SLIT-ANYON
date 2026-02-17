import type { ReactNode } from "react";
import { ClipboardList } from "lucide-react";
import { ToolCallCard } from "./ToolCallCard";
import type { ToolCallStatus } from "./types";

interface WritePlanToolProps {
  title?: string;
  summary?: string;
  complete?: string;
  node?: any;
  status?: ToolCallStatus;
  children?: ReactNode;
  className?: string;
}

export function WritePlanTool({
  title: titleProp,
  summary: summaryProp,
  complete: completeProp,
  node,
  status,
  children,
  className,
}: WritePlanToolProps) {
  const planTitle = titleProp || node?.properties?.title || "";
  const summary = summaryProp || node?.properties?.summary || "";
  const complete = completeProp || node?.properties?.complete || "";

  const isInProgress = status === "running" || complete === "false";

  const metadata = isInProgress
    ? [{ label: "status", value: "Generating plan..." }]
    : undefined;

  const content = summary ? (
    <div className="text-sm text-muted-foreground italic">{summary}</div>
  ) : children ? (
    <div className="text-sm text-muted-foreground">{children}</div>
  ) : null;

  return (
    <ToolCallCard
      icon={ClipboardList}
      title="Write Plan"
      subtitle={planTitle}
      status={status}
      metadata={metadata}
      defaultExpanded={!!content}
      className={className}
    >
      {content}
    </ToolCallCard>
  );
}
