import type { AgentTodo } from "@/ipc/types";
import { cn } from "@/lib/utils";
import {
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  Circle,
  ListTodo,
  Loader2,
} from "lucide-react";
import { useState } from "react";

interface TodoListProps {
  todos: AgentTodo[];
}

function getStatusIcon(status: AgentTodo["status"], size: "sm" | "md" = "sm") {
  const sizeClass = size === "sm" ? "w-3.5 h-3.5" : "w-4 h-4";
  switch (status) {
    case "completed":
      return (
        <CheckCircle2
          className={cn(sizeClass, "text-green-500 flex-shrink-0")}
        />
      );
    case "in_progress":
      return (
        <Loader2
          className={cn(sizeClass, "text-blue-500 animate-spin flex-shrink-0")}
        />
      );
    default:
      return (
        <Circle
          className={cn(sizeClass, "text-muted-foreground flex-shrink-0")}
        />
      );
  }
}

export function TodoList({ todos }: TodoListProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  if (!todos.length) return null;

  const completed = todos.filter((t) => t.status === "completed").length;
  const total = todos.length;
  const inProgressTask = todos.find((t) => t.status === "in_progress");
  const allCompleted = completed === total;

  return (
    <div className="border-b border-border/70 bg-background/70">
      <button
        type="button"
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full flex items-center gap-2 py-1.5 px-2 text-xs text-muted-foreground hover:bg-muted/30 transition-colors"
      >
        {inProgressTask ? (
          <Loader2 className="size-4 text-blue-500 animate-spin shrink-0" />
        ) : allCompleted ? (
          <CheckCircle2 className="size-4 text-green-500 shrink-0" />
        ) : (
          <ListTodo className="size-4 text-muted-foreground shrink-0" />
        )}

        <span className={cn("truncate", inProgressTask && "text-foreground")}>
          {inProgressTask
            ? inProgressTask.content
            : allCompleted
              ? "All tasks completed"
              : "Task progress"}
        </span>

        <span className="text-muted-foreground/60 select-none">&middot;</span>
        <span className="tabular-nums shrink-0">
          {completed}/{total}
        </span>

        {isExpanded ? (
          <ChevronUp className="size-3.5 shrink-0 ml-auto" />
        ) : (
          <ChevronDown className="size-3.5 shrink-0 ml-auto" />
        )}
      </button>

      {isExpanded && (
        <ul className="px-2 pb-2.5 space-y-1">
          {todos.map((todo) => (
            <li
              key={todo.id}
              className={cn(
                "flex items-center gap-2.5 text-sm py-0.5 pl-0.5",
                todo.status === "completed" && "text-muted-foreground",
              )}
            >
              {getStatusIcon(todo.status)}
              <span
                className={cn(todo.status === "completed" && "line-through")}
              >
                {todo.content}
              </span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
