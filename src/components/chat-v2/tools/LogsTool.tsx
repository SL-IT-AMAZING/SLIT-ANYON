import type { ReactNode } from "react";
import { ScrollText } from "lucide-react";
import { useTranslation } from "react-i18next";
import { ToolCallCard } from "./ToolCallCard";
import type { ToolCallStatus } from "./types";

interface LogsToolProps {
  node?: any;
  status?: ToolCallStatus;
  children?: ReactNode;
  className?: string;
}

export function LogsTool({ node, status, children, className }: LogsToolProps) {
  const { t } = useTranslation("chat");
  const count = node?.properties?.count;
  const type = node?.properties?.type;
  const level = node?.properties?.level;

  const parts: string[] = [];
  if (type) parts.push(`type: ${type}`);
  if (level) parts.push(`level: ${level}`);

  let subtitle: string | undefined;
  if (count) {
    subtitle = `Reading ${count} logs`;
  } else if (parts.length > 0) {
    subtitle = `Reading logs (${parts.join(", ")})`;
  }

  return (
    <ToolCallCard
      icon={ScrollText}
      title={t("tools.logs")}
      subtitle={subtitle}
      status={status}
      className={className}
    >
      {children ? (
        <pre className="text-xs text-muted-foreground font-mono whitespace-pre-wrap max-h-60 overflow-y-auto">
          {children}
        </pre>
      ) : null}
    </ToolCallCard>
  );
}
