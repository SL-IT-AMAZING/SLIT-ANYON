import type { ReactNode } from "react";
import { useMemo } from "react";
import { FileEdit } from "lucide-react";
import { ToolCallCard } from "./ToolCallCard";
import type { ToolCallStatus } from "./types";
import { parseSearchReplaceBlocks } from "@/pro/shared/search_replace_parser";

interface SearchReplaceToolProps {
  path?: string;
  description?: string;
  node?: any;
  status?: ToolCallStatus;
  children?: ReactNode;
  className?: string;
}

export function SearchReplaceTool({
  path: pathProp,
  description: descriptionProp,
  node,
  status,
  children,
  className,
}: SearchReplaceToolProps) {
  const path = pathProp || node?.properties?.path || "";
  const description = descriptionProp || node?.properties?.description || "";
  const fileName = path ? path.split("/").pop() : "";

  const blocks = useMemo(
    () => parseSearchReplaceBlocks(String(children ?? "")),
    [children],
  );

  const metadata: Array<{ label: string; value: string }> = [];
  if (path) metadata.push({ label: "path", value: path });
  if (description) metadata.push({ label: "description", value: description });

  return (
    <ToolCallCard
      icon={FileEdit}
      title="Search & Replace"
      subtitle={fileName || undefined}
      status={status}
      metadata={metadata.length > 0 ? metadata : undefined}
      className={className}
    >
      {children && (
        <div className="text-xs font-mono">
          {blocks.length > 0 ? (
            <div className="space-y-2">
              {blocks.map((block, i) => (
                <div
                  key={i}
                  className="rounded border border-border/30 overflow-hidden"
                >
                  <div className="px-2 py-1 bg-muted/30 text-muted-foreground font-medium border-b border-border/30">
                    Change {i + 1}
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2">
                    <div className="p-2 border-b md:border-b-0 md:border-r border-border/30">
                      <div className="text-[11px] text-muted-foreground font-medium mb-1">
                        Search
                      </div>
                      <pre className="text-xs text-muted-foreground whitespace-pre-wrap">
                        {block.searchContent}
                      </pre>
                    </div>
                    <div className="p-2">
                      <div className="text-[11px] text-muted-foreground font-medium mb-1">
                        Replace
                      </div>
                      <pre className="text-xs text-muted-foreground whitespace-pre-wrap">
                        {block.replaceContent}
                      </pre>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <pre className="text-xs text-muted-foreground whitespace-pre-wrap max-h-60 overflow-y-auto">
              {children}
            </pre>
          )}
        </div>
      )}
    </ToolCallCard>
  );
}
