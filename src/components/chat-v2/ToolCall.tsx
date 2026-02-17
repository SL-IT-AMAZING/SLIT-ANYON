import { cn } from "@/lib/utils";
import {
  Check,
  ChevronDown,
  ChevronRight,
  Eye,
  FileEdit,
  Globe,
  Search,
  Terminal,
  Wrench,
  X,
} from "lucide-react";
import { useState } from "react";
import { LogoSpinner } from "./LogoSpinner";

interface ToolCallProps {
  toolName: string;
  args?: Record<string, string | number>;
  status?: "running" | "completed" | "error";
  result?: string;
  className?: string;
}

function getToolIcon(toolName: string) {
  switch (toolName.toLowerCase()) {
    case "read":
      return Eye;
    case "edit":
    case "write":
      return FileEdit;
    case "bash":
      return Terminal;
    case "search":
    case "grep":
    case "glob":
      return Search;
    case "webfetch":
      return Globe;
    default:
      return Wrench;
  }
}

function formatArgs(args: Record<string, string | number>): string {
  return Object.entries(args)
    .map(([key, value]) => `${key}=${value}`)
    .join(" ");
}

export function ToolCall({
  toolName,
  args,
  status = "completed",
  result,
  className,
}: ToolCallProps) {
  const [expanded, setExpanded] = useState(false);
  const Icon = getToolIcon(toolName);
  const hasResult = status === "completed" && result != null;

  const handleToggle = () => {
    if (hasResult) {
      setExpanded((prev) => !prev);
    }
  };

  return (
    <div className={cn("flex flex-col", className)}>
      <div
        className={cn(
          "flex items-center gap-2 px-3 py-2 rounded-lg border border-border/50 bg-muted/20",
          hasResult && "cursor-pointer",
        )}
        onClick={handleToggle}
        onKeyDown={(e) => {
          if (hasResult && (e.key === "Enter" || e.key === " ")) {
            e.preventDefault();
            handleToggle();
          }
        }}
        role={hasResult ? "button" : undefined}
        tabIndex={hasResult ? 0 : undefined}
      >
        <Icon className="size-4 shrink-0 text-muted-foreground" />
        <span className="text-sm font-medium text-foreground">{toolName}</span>
        {args && Object.keys(args).length > 0 && (
          <span className="text-xs text-muted-foreground truncate">
            {formatArgs(args)}
          </span>
        )}
        <div className="ml-auto flex items-center gap-1.5 shrink-0">
          {status === "running" && (
            <LogoSpinner variant="strokeLoop" size={14} />
          )}
          {status === "completed" && (
            <Check className="size-3.5 text-muted-foreground" />
          )}
          {status === "error" && (
            <X className="size-3.5 text-destructive-foreground" />
          )}
          {hasResult &&
            (expanded ? (
              <ChevronDown className="size-3.5 text-muted-foreground" />
            ) : (
              <ChevronRight className="size-3.5 text-muted-foreground" />
            ))}
        </div>
      </div>
      {expanded && result && (
        <div className="mt-1 rounded-b-lg border border-t-0 border-border/50 bg-muted/10 px-3 py-2">
          <pre className="text-xs text-muted-foreground font-mono whitespace-pre-wrap overflow-x-auto">
            {result}
          </pre>
        </div>
      )}
    </div>
  );
}
