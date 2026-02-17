import type { ReactNode } from "react";
import { List } from "lucide-react";
import { ToolCallCard } from "./ToolCallCard";
import type { ToolCallStatus } from "./types";

interface ListFilesToolProps {
  directory?: string;
  recursive?: string;
  node?: any;
  status?: ToolCallStatus;
  children?: ReactNode;
  className?: string;
}

export function ListFilesTool({
  directory: directoryProp,
  recursive: recursiveProp,
  node,
  status,
  children,
  className,
}: ListFilesToolProps) {
  const directory = directoryProp || node?.properties?.directory || "";
  const recursive = recursiveProp || node?.properties?.recursive || "";
  const isRecursive = recursive === "true";

  const metadata: Array<{ label: string; value: string }> = [];
  if (directory) metadata.push({ label: "directory", value: directory });
  if (isRecursive) metadata.push({ label: "recursive", value: "true" });

  return (
    <ToolCallCard
      icon={List}
      title="List Files"
      subtitle={directory || undefined}
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
