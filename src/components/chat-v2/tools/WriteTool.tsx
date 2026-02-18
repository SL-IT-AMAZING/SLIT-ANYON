import type { ReactNode } from "react";
import { FilePlus } from "lucide-react";
import { useTranslation } from "react-i18next";
import { ToolCallCard } from "./ToolCallCard";
import type { ToolCallStatus } from "./types";

interface WriteToolProps {
  path?: string;
  description?: string;
  node?: any;
  status?: ToolCallStatus;
  children?: ReactNode;
  className?: string;
}

export function WriteTool({
  path: pathProp,
  description: descriptionProp,
  node,
  status,
  children,
  className,
}: WriteToolProps) {
  const { t } = useTranslation("chat");
  const path = pathProp || node?.properties?.path || "";
  const description = descriptionProp || node?.properties?.description || "";
  const fileName = path ? path.split("/").pop() : "";

  const metadata: Array<{ label: string; value: string }> = [];
  if (path) metadata.push({ label: "path", value: path });
  if (description) metadata.push({ label: "description", value: description });

  return (
    <ToolCallCard
      icon={FilePlus}
      title={t("tools.write")}
      subtitle={fileName || undefined}
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
