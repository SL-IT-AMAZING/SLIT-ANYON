import type { ReactNode } from "react";
import { Search } from "lucide-react";
import { ToolCallCard } from "./ToolCallCard";
import type { ToolCallStatus } from "./types";

interface GrepToolProps {
  query?: string;
  include?: string;
  exclude?: string;
  caseSensitive?: boolean;
  count?: string;
  node?: any;
  status?: ToolCallStatus;
  children?: ReactNode;
  className?: string;
}

export function GrepTool({
  query: queryProp,
  include: includeProp,
  exclude: excludeProp,
  caseSensitive: caseSensitiveProp,
  count: countProp,
  node,
  status,
  children,
  className,
}: GrepToolProps) {
  const query = queryProp || node?.properties?.query || "";
  const includePattern = includeProp || node?.properties?.include || "";
  const excludePattern = excludeProp || node?.properties?.exclude || "";
  const caseSensitive =
    caseSensitiveProp ?? node?.properties?.["case-sensitive"] === "true";
  const count = countProp || node?.properties?.count || "";

  const metadata: Array<{ label: string; value: string }> = [];
  if (includePattern) {
    metadata.push({ label: "include", value: includePattern });
  }
  if (excludePattern) {
    metadata.push({ label: "exclude", value: excludePattern });
  }
  if (caseSensitive) {
    metadata.push({ label: "case-sensitive", value: "true" });
  }
  if (count) {
    metadata.push({ label: "count", value: count });
  }

  return (
    <ToolCallCard
      icon={Search}
      title="Grep"
      subtitle={query ? `"${query}"` : undefined}
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
