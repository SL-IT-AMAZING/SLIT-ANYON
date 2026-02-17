import type { LucideIcon } from "lucide-react";
import {
  Database,
  Cpu,
  Eye,
  FileEdit,
  FilePlus,
  Globe,
  List,
  ListChecks,
  MessageCircle,
  Package,
  Plug,
  Search,
  Terminal,
  Wrench,
  Brain,
  Activity,
  AlertTriangle,
  ScrollText,
  FolderTree,
  ClipboardList,
  LogOut,
  ArrowRight,
  Trash2,
  Server,
  Table,
  Info,
} from "lucide-react";

export type ToolCallStatus = "running" | "completed" | "error";

/** Maps tool names (from XML tags and OpenCode tools) to their display icon */
export function getToolIcon(toolName: string): LucideIcon {
  const name = toolName.toLowerCase();
  switch (name) {
    case "read":
    case "anyon-read":
      return Eye;
    case "write":
    case "anyon-write":
      return FilePlus;
    case "edit":
    case "anyon-edit":
    case "anyon-search-replace":
    case "apply_patch":
      return FileEdit;
    case "bash":
    case "anyon-command":
      return Terminal;
    case "grep":
    case "anyon-grep":
    case "glob":
      return Search;
    case "anyon-code-search":
    case "anyon-code-search-result":
      return Search;
    case "webfetch":
    case "anyon-web-search":
    case "anyon-web-search-result":
    case "anyon-web-crawl":
      return Globe;
    case "anyon-mcp-tool-call":
    case "anyon-mcp-tool-result":
      return Wrench;
    case "task":
      return Cpu;
    case "todowrite":
      return ListChecks;
    case "question":
      return MessageCircle;
    case "list":
    case "anyon-list-files":
      return List;
    case "think":
      return Brain;
    case "anyon-status":
      return Activity;
    case "anyon-output":
      return AlertTriangle;
    case "anyon-read-logs":
      return ScrollText;
    case "anyon-codebase-context":
      return FolderTree;
    case "anyon-add-dependency":
      return Package;
    case "anyon-add-integration":
      return Plug;
    case "anyon-execute-sql":
    case "anyon-database-schema":
      return Database;
    case "anyon-supabase-table-schema":
      return Table;
    case "anyon-supabase-project-info":
      return Server;
    case "anyon-write-plan":
      return ClipboardList;
    case "anyon-exit-plan":
      return LogOut;
    case "anyon-rename":
      return ArrowRight;
    case "anyon-delete":
      return Trash2;
    case "anyon-problem-report":
      return Info;
    default:
      return Wrench;
  }
}

/** Maps CustomTagState from AnyonMarkdownParser to ToolCallStatus */
export function mapTagStateToStatus(
  state: "pending" | "finished" | "aborted" | undefined,
): ToolCallStatus {
  switch (state) {
    case "pending":
      return "running";
    case "aborted":
      return "error";
    case "finished":
    default:
      return "completed";
  }
}
