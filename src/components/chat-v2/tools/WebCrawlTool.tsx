import type { ReactNode } from "react";
import { Globe } from "lucide-react";
import { useTranslation } from "react-i18next";
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
  const { t } = useTranslation("chat");
  return (
    <ToolCallCard
      icon={Globe}
      title={t("tools.webCrawl")}
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
