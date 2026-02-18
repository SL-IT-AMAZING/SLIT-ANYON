import type { ReactNode } from "react";
import { ArrowRight } from "lucide-react";
import { useTranslation } from "react-i18next";
import { ToolCallCard } from "./ToolCallCard";
import type { ToolCallStatus } from "./types";

interface RenameToolProps {
  from?: string;
  to?: string;
  node?: any;
  status?: ToolCallStatus;
  children?: ReactNode;
  className?: string;
}

export function RenameTool({
  from: fromProp,
  to: toProp,
  node,
  status,
  children,
  className,
}: RenameToolProps) {
  const { t } = useTranslation("chat");
  const from = fromProp || node?.properties?.from || "";
  const to = toProp || node?.properties?.to || "";

  const fromFileName = from ? from.split("/").pop() : "";
  const toFileName = to ? to.split("/").pop() : "";

  const subtitle =
    fromFileName && toFileName
      ? `${fromFileName} → ${toFileName}`
      : fromFileName || toFileName || undefined;

  const metadata: Array<{ label: string; value: string }> = [];
  if (from) metadata.push({ label: "from", value: from });
  if (to) metadata.push({ label: "to", value: to });

  return (
    <ToolCallCard
      icon={ArrowRight}
      title={t("tools.rename")}
      subtitle={subtitle}
      status={status}
      metadata={metadata.length > 0 ? metadata : undefined}
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
