import type { ReactNode } from "react";
import { Package } from "lucide-react";
import { ToolCallCard } from "./ToolCallCard";
import type { ToolCallStatus } from "./types";

interface AddDependencyToolProps {
  packages?: string;
  node?: any;
  status?: ToolCallStatus;
  children?: ReactNode;
  className?: string;
}

export function AddDependencyTool({
  packages: packagesProp,
  node,
  status,
  children,
  className,
}: AddDependencyToolProps) {
  const raw = packagesProp || node?.properties?.packages || "";
  const packageList = raw.split(" ").filter(Boolean);
  const subtitle = packageList.length > 0 ? packageList.join(", ") : undefined;

  return (
    <ToolCallCard
      icon={Package}
      title="Add Dependency"
      subtitle={subtitle}
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
