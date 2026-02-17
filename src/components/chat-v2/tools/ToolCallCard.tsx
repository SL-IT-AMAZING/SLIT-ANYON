import type { ReactNode } from "react";
import { useState } from "react";
import { Check, ChevronDown, ChevronRight, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { LogoSpinner } from "../LogoSpinner";

interface ToolCallCardProps {
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  subtitle?: string;
  status?: "running" | "completed" | "error";
  defaultExpanded?: boolean;
  metadata?: Array<{ label: string; value: string }>;
  children?: ReactNode;
  className?: string;
}

export function ToolCallCard({
  icon: Icon,
  title,
  subtitle,
  status,
  defaultExpanded = false,
  metadata,
  children,
  className,
}: ToolCallCardProps) {
  const hasChildren = children != null;
  const [expanded, setExpanded] = useState(defaultExpanded && hasChildren);

  const handleToggle = () => {
    if (hasChildren) {
      setExpanded((prev) => !prev);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (hasChildren && (e.key === "Enter" || e.key === " ")) {
      e.preventDefault();
      handleToggle();
    }
  };

  return (
    <div
      className={cn(
        "rounded-lg border border-border/50 bg-muted/20 px-3 py-2 my-1.5",
        hasChildren && "cursor-pointer hover:bg-muted/30",
        className,
      )}
      onClick={handleToggle}
      onKeyDown={handleKeyDown}
      role={hasChildren ? "button" : undefined}
      tabIndex={hasChildren ? 0 : undefined}
    >
      <div className="flex items-center gap-2">
        <Icon className="size-4 shrink-0 text-muted-foreground" />
        <span className="text-sm font-medium text-foreground">{title}</span>
        {subtitle && (
          <span className="text-xs text-muted-foreground truncate">
            {subtitle}
          </span>
        )}
        <div className="ml-auto flex items-center gap-1.5 shrink-0">
          {status === "running" && <LogoSpinner variant="strokeLoop" size={14} />}
          {status === "completed" && (
            <Check className="size-3.5 text-muted-foreground" />
          )}
          {status === "error" && (
            <X className="size-3.5 text-muted-foreground" />
          )}
          {hasChildren &&
            (expanded ? (
              <ChevronDown className="size-3.5 text-muted-foreground" />
            ) : (
              <ChevronRight className="size-3.5 text-muted-foreground" />
            ))}
        </div>
      </div>

      {metadata && metadata.length > 0 && (
        <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-0.5">
          {metadata.map((item) => (
            <span key={item.label} className="text-xs text-muted-foreground">
              {item.label}: {item.value}
            </span>
          ))}
        </div>
      )}

      {hasChildren && (
        <div
          className={cn(
            "grid transition-[grid-template-rows] duration-200 ease-out",
            expanded ? "grid-rows-[1fr]" : "grid-rows-[0fr]",
          )}
        >
          <div className="overflow-hidden">
            <div
              className={cn(
                "mt-2 pt-2 border-t border-border/30",
                !expanded && "invisible",
              )}
            >
              {children}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
