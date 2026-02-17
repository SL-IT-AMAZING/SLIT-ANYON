import { FileText } from "lucide-react";
import type React from "react";
import type { ReactNode } from "react";

interface AnyonReadProps {
  children?: ReactNode;
  node?: any;
  path?: string;
}

export const AnyonRead: React.FC<AnyonReadProps> = ({
  children,
  node,
  path: pathProp,
}) => {
  const path = pathProp || node?.properties?.path || "";
  const fileName = path ? path.split("/").pop() : "";

  return (
    <div className="bg-(--background-lightest) rounded-lg px-4 py-2 border border-border my-2">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <FileText size={16} className="text-muted-foreground" />
          {fileName && (
            <span className="text-muted-foreground font-medium text-sm">
              {fileName}
            </span>
          )}
          <div className="text-xs text-muted-foreground font-medium">Read</div>
        </div>
      </div>
      {path && (
        <div className="text-xs text-muted-foreground font-medium mb-1">
          {path}
        </div>
      )}
      {children && (
        <div className="text-sm text-muted-foreground mt-2">{children}</div>
      )}
    </div>
  );
};
