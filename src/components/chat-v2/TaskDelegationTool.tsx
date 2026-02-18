import { cn } from "@/lib/utils";
import { Check, Cpu, X } from "lucide-react";
import { useTranslation } from "react-i18next";
import { BasicTool } from "./BasicTool";
import { getToolIcon } from "./tools/types";

/** A single tool being executed inside the delegated agent's session */
export interface ChildToolSummary {
  id: string;
  toolName: string;
  title: string;
  subtitle?: string;
  status: "running" | "completed" | "error";
}

export interface TaskDelegationToolProps {
  /** Agent type/name (e.g., "explore", "oracle", "librarian", "Sisyphus-Junior") */
  agentType: string;
  /** Description of the delegated task */
  description?: string;
  /** List of tools the child agent has used/is using */
  childTools?: ChildToolSummary[];
  /** Whether the task is currently running */
  running?: boolean;
  /** Callback when subtitle (description) is clicked — e.g., navigate to child session */
  onDescriptionClick?: () => void;
  /** Child permission: if the sub-agent needs approval, show it here */
  permissionContent?: React.ReactNode;
  /** Additional className */
  className?: string;
}

export function TaskDelegationTool({
  agentType,
  description,
  childTools = [],
  running: _running = false,
  onDescriptionClick,
  permissionContent,
  className,
}: TaskDelegationToolProps) {
  const { t } = useTranslation("app");
  const baseType = agentType.includes(" (")
    ? agentType.slice(0, agentType.indexOf(" ("))
    : agentType;
  const translated = t(`agents.${baseType}.name`, { defaultValue: "" });
  const displayName = translated || capitalize(agentType);

  return (
    <div className={cn("", className)}>
      <BasicTool
        icon={Cpu}
        defaultOpen={true}
        trigger={{
          title: `${displayName} Agent`,
          subtitle: description,
        }}
        onSubtitleClick={onDescriptionClick}
      >
        {childTools.length > 0 && (
          <div className="max-h-48 space-y-0 overflow-y-auto">
            {childTools.map((tool) => {
              const ToolIcon = getToolIcon(tool.toolName);
              return (
                <div
                  key={tool.id}
                  className="flex items-center gap-2 py-0.5 text-xs"
                >
                  <ToolIcon className="size-3.5 shrink-0 text-muted-foreground" />
                  <span className="shrink-0 text-muted-foreground">
                    {tool.title}
                  </span>
                  {tool.subtitle && (
                    <span className="truncate text-muted-foreground/60">
                      {tool.subtitle}
                    </span>
                  )}
                  {tool.status === "running" && (
                    <span className="ml-auto size-1.5 shrink-0 animate-pulse rounded-full bg-foreground/40" />
                  )}
                  {tool.status === "completed" && (
                    <Check className="ml-auto size-3 shrink-0 text-muted-foreground/40" />
                  )}
                  {tool.status === "error" && (
                    <X className="ml-auto size-3 shrink-0 text-muted-foreground/40" />
                  )}
                </div>
              );
            })}
          </div>
        )}
      </BasicTool>

      {permissionContent}
    </div>
  );
}

function capitalize(s: string): string {
  return s.charAt(0).toUpperCase() + s.slice(1);
}
