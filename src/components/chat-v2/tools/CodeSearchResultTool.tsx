import type { ReactNode } from "react";
import { Search } from "lucide-react";
import { useTranslation } from "react-i18next";
import { ToolCallCard } from "./ToolCallCard";
import type { ToolCallStatus } from "./types";

interface CodeSearchResultToolProps {
  node?: any;
  status?: ToolCallStatus;
  children?: ReactNode;
  className?: string;
}

function parseFilePaths(children: ReactNode): string[] {
  const text = typeof children === "string" ? children : String(children ?? "");
  return text
    .split("\n")
    .map((line) => line.trim())
    .filter((line) => line.length > 0 && !line.startsWith("<"));
}

export function CodeSearchResultTool({
  node: _node,
  status,
  children,
  className,
}: CodeSearchResultToolProps) {
  const { t } = useTranslation("chat");
  const filePaths = children ? parseFilePaths(children) : [];
  const fileCount = filePaths.length;

  return (
    <ToolCallCard
      icon={Search}
      title={t("tools.codeSearchResult")}
      subtitle={fileCount > 0 ? `Found ${fileCount} files` : undefined}
      status={status}
      className={className}
    >
      {filePaths.length > 0 && (
        <div className="flex flex-col gap-1 max-h-60 overflow-y-auto">
          {filePaths.map((filePath) => (
            <div
              key={filePath}
              className="text-xs text-muted-foreground font-mono bg-muted/30 rounded px-2 py-1"
            >
              {filePath}
            </div>
          ))}
        </div>
      )}
    </ToolCallCard>
  );
}
