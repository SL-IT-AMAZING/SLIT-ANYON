import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { cn } from "@/lib/utils";
import { ChevronsUpDown, FileCode, Wrench } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { BasicTool } from "./BasicTool";
import { LogoSpinner } from "./LogoSpinner";
import { MarkdownContent } from "./MarkdownContent";

export function computeStatus(toolName: string | undefined): string {
  switch (toolName) {
    case "task":
      return "Delegating work";
    case "todowrite":
    case "todoread":
      return "Planning next steps";
    case "read":
      return "Gathering context";
    case "list":
    case "grep":
    case "glob":
      return "Searching the codebase";
    case "webfetch":
      return "Searching the web";
    case "edit":
    case "write":
      return "Making edits";
    case "bash":
      return "Running commands";
    default:
      return "Thinking";
  }
}

export interface StepItem {
  id: string;
  type: "tool" | "reasoning" | "text";
  toolName?: string;
  toolIcon?: LucideIcon;
  title?: string;
  subtitle?: string;
  args?: string[];
  content?: React.ReactNode;
  text?: string;
}

export interface FileDiff {
  file: string;
  additions: number;
  deletions: number;
  content?: React.ReactNode;
}

export interface PermissionItem {
  id: string;
  toolName: string;
  toolIcon?: LucideIcon;
  title: string;
  subtitle?: string;
  content?: React.ReactNode;
}

export interface SessionTurnProps {
  userMessage: string;
  steps: StepItem[];
  response?: string;
  diffs?: FileDiff[];
  working?: boolean;
  statusText?: string;
  duration?: string;
  stepsExpanded?: boolean;
  onToggleSteps?: () => void;
  error?: string;
  permissions?: PermissionItem[];
  className?: string;
}

export function SessionTurn({
  userMessage,
  steps,
  response,
  diffs,
  working = false,
  statusText,
  duration,
  stepsExpanded = false,
  onToggleSteps,
  error,
  permissions,
  className,
}: SessionTurnProps) {
  // Reasoning steps are ephemeral: only visible while the AI is actively working
  const visibleSteps = working
    ? steps
    : steps.filter((s) => s.type !== "reasoning");
  const hasUserMessage = userMessage.trim().length > 0;
  const canExpandSteps = working || visibleSteps.length > 0;

  const hasSteps = working || visibleSteps.length > 0;
  const hasResponse = !working && (response || (diffs && diffs.length > 0));

  return (
    <div
      data-component="session-turn"
      className={cn("flex flex-col", className)}
    >
      {hasUserMessage && (
        <div className="sticky top-0 z-10 bg-background pb-1">
          <div className="ml-auto w-fit max-w-[92%] rounded-xl border border-border/70 bg-muted/35 px-3 py-1.5">
            <div className="text-sm text-foreground whitespace-pre-wrap break-words">
              {userMessage}
            </div>
          </div>
        </div>
      )}

      {hasSteps && (
        <div
          className={cn(
            "sticky z-10 bg-background",
            hasUserMessage ? "top-[28px]" : "top-0",
          )}
        >
          <button
            type="button"
            onClick={onToggleSteps}
            className="flex items-center gap-2 py-1.5 px-2 text-xs text-muted-foreground hover:bg-muted/30 rounded w-full transition-colors"
          >
            {working && <LogoSpinner variant="strokeLoop" size={16} />}

            <span className={cn("truncate", working && "animate-shimmer")}>
              {working
                ? statusText || "Thinking"
                : stepsExpanded
                  ? "Hide steps"
                  : "Show steps"}
            </span>

            <span className="text-muted-foreground/60 select-none">
              &middot;
            </span>

            {duration && (
              <span className="tabular-nums shrink-0">{duration}</span>
            )}

            {canExpandSteps && (
              <ChevronsUpDown className="size-3.5 shrink-0 ml-auto" />
            )}
          </button>
        </div>
      )}

      {stepsExpanded && canExpandSteps && (
        <div className="py-2 space-y-0.5">
          {visibleSteps.length === 0 && working && (
            <div className="text-xs text-muted-foreground italic pl-6 py-1">
              Waiting for agent reasoning and tool events...
            </div>
          )}
          {visibleSteps.map((step) => {
            if (step.type === "reasoning") {
              return (
                <div
                  key={step.id}
                  className="text-xs text-muted-foreground italic pl-6 py-1"
                >
                  <MarkdownContent content={step.text ?? ""} />
                </div>
              );
            }

            if (step.type === "tool") {
              const Icon = step.toolIcon ?? Wrench;
              return (
                <BasicTool
                  key={step.id}
                  icon={Icon}
                  trigger={{
                    title: step.title ?? step.toolName ?? "Tool",
                    subtitle: step.subtitle,
                    args: step.args,
                  }}
                >
                  {step.content}
                </BasicTool>
              );
            }

            return (
              <div
                key={step.id}
                className="text-xs text-muted-foreground pl-6 py-1"
              >
                {step.text}
              </div>
            );
          })}
        </div>
      )}

      {!stepsExpanded && permissions && permissions.length > 0 && (
        <div className="py-2 space-y-2">
          {permissions.map((p) => {
            const Icon = p.toolIcon ?? Wrench;
            return (
              <BasicTool
                key={p.id}
                icon={Icon}
                trigger={{ title: p.title, subtitle: p.subtitle }}
                forceOpen
              >
                {p.content}
              </BasicTool>
            );
          })}
        </div>
      )}

      {hasResponse && (
        <div className="pt-4 space-y-3">
          {response && (
            <div className="text-sm">
              <MarkdownContent content={response} />
            </div>
          )}

          {diffs && diffs.length > 0 && (
            <Accordion>
              {diffs.map((diff) => (
                <AccordionItem key={diff.file} value={diff.file}>
                  <AccordionTrigger className="py-2 text-sm hover:no-underline">
                    <div className="flex items-center gap-2 w-full">
                      <FileCode className="size-4 shrink-0 text-muted-foreground" />
                      <span className="text-sm truncate">{diff.file}</span>
                      <span className="text-xs text-muted-foreground ml-auto tabular-nums shrink-0">
                        +{diff.additions} &minus;{diff.deletions}
                      </span>
                    </div>
                  </AccordionTrigger>
                  <AccordionContent>
                    {diff.content ?? (
                      <pre className="text-xs text-muted-foreground font-mono whitespace-pre-wrap">
                        diff content
                      </pre>
                    )}
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          )}
        </div>
      )}

      {error && !stepsExpanded && (
        <div className="mt-3 p-3 rounded-lg border border-border bg-muted/20 text-sm text-muted-foreground">
          {error}
        </div>
      )}
    </div>
  );
}
