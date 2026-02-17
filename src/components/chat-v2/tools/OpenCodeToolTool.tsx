import type { ReactNode } from "react";
import { useMemo } from "react";
import type { LucideIcon } from "lucide-react";
import {
  Cpu,
  Eye,
  FileEdit,
  FilePlus,
  Globe,
  List,
  ListChecks,
  MessageCircle,
  Search,
  Terminal,
  Wrench,
} from "lucide-react";
import { ToolCallCard } from "./ToolCallCard";
import type { ToolCallStatus } from "./types";

interface OpenCodeToolToolProps {
  name: string;
  status: string;
  title: string;
  children?: ReactNode;
  className?: string;
}

interface ToolInfo {
  icon: LucideIcon;
  label: string;
}

function getToolInfo(name: string): ToolInfo {
  switch (name.toLowerCase()) {
    case "read":
      return { icon: Eye, label: "READ" };
    case "list":
      return { icon: List, label: "LIST" };
    case "glob":
      return { icon: Search, label: "GLOB" };
    case "grep":
      return { icon: Search, label: "GREP" };
    case "webfetch":
      return { icon: Globe, label: "WEBFETCH" };
    case "task":
      return { icon: Cpu, label: "TASK" };
    case "bash":
      return { icon: Terminal, label: "BASH" };
    case "edit":
      return { icon: FileEdit, label: "EDIT" };
    case "write":
      return { icon: FilePlus, label: "WRITE" };
    case "apply_patch":
      return { icon: FileEdit, label: "APPLY_PATCH" };
    case "todowrite":
      return { icon: ListChecks, label: "TODOWRITE" };
    case "question":
      return { icon: MessageCircle, label: "QUESTION" };
    default:
      return { icon: Wrench, label: name.toUpperCase() };
  }
}

function mapStatus(status: string): ToolCallStatus {
  switch (status) {
    case "running":
      return "running";
    case "error":
      return "error";
    case "completed":
      return "completed";
    default:
      return "completed";
  }
}

export function OpenCodeToolTool({
  name,
  status,
  title,
  children,
  className,
}: OpenCodeToolToolProps) {
  const { icon, label } = getToolInfo(name);
  const mappedStatus = mapStatus(status);

  const subtitle =
    title && title !== name && title !== label ? title : undefined;

  const raw = typeof children === "string" ? children : String(children ?? "");
  const prettyContent = useMemo(() => {
    if (!raw.trim()) return "";
    try {
      return JSON.stringify(JSON.parse(raw), null, 2);
    } catch {
      return raw;
    }
  }, [raw]);

  return (
    <ToolCallCard
      icon={icon}
      title={label}
      subtitle={subtitle}
      status={mappedStatus}
      className={className}
    >
      {prettyContent && (
        <pre className="text-xs text-muted-foreground font-mono whitespace-pre-wrap max-h-60 overflow-y-auto">
          {prettyContent}
        </pre>
      )}
    </ToolCallCard>
  );
}
