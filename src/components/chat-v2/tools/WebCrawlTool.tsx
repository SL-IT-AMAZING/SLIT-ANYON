import type { ReactNode } from "react";
import { Globe } from "lucide-react";
import { ToolCallCard } from "./ToolCallCard";
import type { ToolCallStatus } from "./types";

interface WebCrawlToolProps {
  node?: any;
  status?: ToolCallStatus;
  children?: ReactNode;
  className?: string;
}

export function WebCrawlTool({
  node: _node,
  status,
  children,
  className,
}: WebCrawlToolProps) {
  return (
    <ToolCallCard
      icon={Globe}
      title="Web Crawl"
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
