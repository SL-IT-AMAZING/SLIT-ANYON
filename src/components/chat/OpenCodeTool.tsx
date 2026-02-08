import {
  Bot,
  ChevronsDownUp,
  ChevronsUpDown,
  Eye,
  FileEdit,
  FilePlus,
  Globe,
  List,
  ListChecks,
  Loader2,
  MessageCircle,
  Search,
  Terminal,
  Wrench,
} from "lucide-react";
import { useMemo, useState } from "react";
import { CodeHighlight } from "./CodeHighlight";

interface OpenCodeToolProps {
  name: string;
  status: string;
  title: string;
  children?: React.ReactNode;
}

function getToolInfo(name: string): { icon: React.ElementType; label: string } {
  const toolName = name.toLowerCase();

  switch (toolName) {
    case "read":
      return { icon: Eye, label: "Read" };
    case "list":
      return { icon: List, label: "List" };
    case "glob":
      return { icon: Search, label: "Glob" };
    case "grep":
      return { icon: Search, label: "Grep" };
    case "webfetch":
      return { icon: Globe, label: "Web Fetch" };
    case "task":
      return { icon: Bot, label: "Task" };
    case "bash":
      return { icon: Terminal, label: "Shell" };
    case "edit":
      return { icon: FileEdit, label: "Edit" };
    case "write":
      return { icon: FilePlus, label: "Write" };
    case "apply_patch":
      return { icon: FileEdit, label: "Apply Patch" };
    case "todowrite":
      return { icon: ListChecks, label: "Todo" };
    case "question":
      return { icon: MessageCircle, label: "Question" };
    default:
      return { icon: Wrench, label: name };
  }
}

export const OpenCodeTool: React.FC<OpenCodeToolProps> = ({
  name,
  status,
  title,
  children,
}) => {
  const [expanded, setExpanded] = useState(false);
  const isRunning = status === "running";
  const isError = status === "error";
  const isCompleted = status === "completed";

  const raw = typeof children === "string" ? children : String(children ?? "");
  const hasContent = raw.trim().length > 0;

  const { icon: Icon, label } = getToolInfo(name);

  const subtitle = title && title !== name && title !== label ? title : "";

  const formattedContent = useMemo(() => {
    if (!expanded || !raw.trim()) return "";
    try {
      const parsed = JSON.parse(raw);
      return JSON.stringify(parsed, null, 2);
    } catch {
      return raw;
    }
  }, [expanded, raw]);

  const borderClass = isRunning
    ? "border-(--primary)"
    : isError
      ? "border-red-500"
      : isCompleted
        ? "border-(--primary)/30"
        : "border-border";

  const handleToggle = () => {
    if (hasContent) {
      setExpanded(!expanded);
    }
  };

  return (
    <div
      data-testid="opencode-tool"
      className={`bg-(--background-lightest) hover:bg-(--background-lighter) rounded-lg px-4 py-2 border my-2 cursor-pointer ${borderClass}`}
      onClick={handleToggle}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          handleToggle();
        }
      }}
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Icon
            size={16}
            className={isError ? "text-red-500" : "text-(--primary)"}
          />
          <span className="text-muted-foreground font-medium text-sm">
            <span className="font-bold mr-2 outline-2 outline-(--primary)/20 bg-(--primary)/10 text-(--primary) rounded-md px-1">
              {label.toUpperCase()}
            </span>
            {subtitle}
          </span>
          {isRunning && (
            <div className="flex items-center text-(--primary) text-xs">
              <Loader2 size={14} className="mr-1 animate-spin" />
              <span>Running...</span>
            </div>
          )}
          {isError && hasContent && (
            <span className="text-xs text-red-500">Error</span>
          )}
        </div>
        {hasContent && (
          <div className="flex items-center">
            {expanded ? (
              <ChevronsDownUp
                size={20}
                className="text-(--primary)/70 hover:text-(--primary)"
              />
            ) : (
              <ChevronsUpDown
                size={20}
                className="text-(--primary)/70 hover:text-(--primary)"
              />
            )}
          </div>
        )}
      </div>
      {expanded && formattedContent && (
        <div className="mt-2 text-xs">
          {isError ? (
            <div className="text-red-600 dark:text-red-400 whitespace-pre-wrap">
              {formattedContent}
            </div>
          ) : (
            <CodeHighlight className="language-json">
              {formattedContent}
            </CodeHighlight>
          )}
        </div>
      )}
    </div>
  );
};
