import type { ReactNode } from "react";
import { Brain } from "lucide-react";
import { useTranslation } from "react-i18next";
import { ToolCallCard } from "./ToolCallCard";
import type { ToolCallStatus } from "./types";

const TOKEN_SAVINGS_PATTERN =
  /^anyon-token-savings\?original-tokens=(\d+)&smart-context-tokens=(\d+)$/;

interface ThinkToolProps {
  node?: { properties?: { state?: string } };
  status?: ToolCallStatus;
  children?: ReactNode;
  className?: string;
}

export function ThinkTool({ status, children, className }: ThinkToolProps) {
  const { t } = useTranslation("chat");
  const text = typeof children === "string" ? children : "";
  const tokenMatch = text.match(TOKEN_SAVINGS_PATTERN);

  const content = tokenMatch ? (
    <div className="text-xs text-muted-foreground font-mono">
      Token savings: {tokenMatch[1]} → {tokenMatch[2]}
    </div>
  ) : children ? (
    <div className="text-sm text-muted-foreground italic">{children}</div>
  ) : null;

  return (
    <ToolCallCard
      icon={Brain}
      title={t("tools.thinking")}
      status={status}
      defaultExpanded={status === "running"}
      className={className}
    >
      {content}
    </ToolCallCard>
  );
}
