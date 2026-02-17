import type { ReactNode } from "react";
import { FolderTree } from "lucide-react";
import { ToolCallCard } from "./ToolCallCard";
import type { ToolCallStatus } from "./types";

interface CodebaseContextToolProps {
  node?: any;
  status?: ToolCallStatus;
  children?: ReactNode;
  className?: string;
}

export function CodebaseContextTool({
  node,
  status,
  children,
  className,
}: CodebaseContextToolProps) {
  const filesRaw = node?.properties?.files;
  const files: string[] = filesRaw
    ? filesRaw.split(",").filter((f: string) => f.trim())
    : [];

  const subtitle = files.length > 0 ? `Using ${files.length} files` : undefined;

  return (
    <ToolCallCard
      icon={FolderTree}
      title="Codebase Context"
      subtitle={subtitle}
      status={status}
      defaultExpanded={status === "running"}
      className={className}
    >
      {files.length > 0 ? (
        <div className="flex flex-wrap gap-1.5">
          {files.map((f, i) => (
            <span
              key={i}
              className="text-xs font-mono text-muted-foreground bg-muted/30 rounded px-1.5 py-0.5"
            >
              {f.trim().split("/").pop()}
            </span>
          ))}
        </div>
      ) : children ? (
        <pre className="text-xs text-muted-foreground font-mono whitespace-pre-wrap max-h-60 overflow-y-auto">
          {children}
        </pre>
      ) : null}
    </ToolCallCard>
  );
}
