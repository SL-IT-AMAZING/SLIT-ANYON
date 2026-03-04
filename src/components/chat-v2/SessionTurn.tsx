import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { chatClient } from "@/ipc/types";
import { cn } from "@/lib/utils";
import { ChevronsUpDown, FileCode, Search, Wrench } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { BasicTool } from "./BasicTool";
import { LogoSpinner } from "./LogoSpinner";
import { MarkdownContent } from "./MarkdownContent";
import { type Question, QuestionPrompt } from "./QuestionPrompt";

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
  type: "tool" | "reasoning" | "text" | "question" | "todo" | "context-group";
  toolName?: string;
  statusToolName?: string;
  toolIcon?: LucideIcon;
  title?: string;
  subtitle?: string;
  args?: string[];
  content?: React.ReactNode;
  text?: string;
  groupedSteps?: StepItem[];
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
  diffs?: FileDiff[];
  working?: boolean;
  statusText?: string;
  duration?: string;
  stepsExpanded?: boolean;
  onToggleSteps?: () => void;
  error?: string;
  permissions?: PermissionItem[];
  className?: string;
  isActive?: boolean;
}

function isToggleOnlyStep(step: StepItem): boolean {
  return (
    step.type === "tool" ||
    step.type === "context-group" ||
    step.type === "reasoning" ||
    step.type === "todo"
  );
}

type Segment =
  | { kind: "toggle"; steps: StepItem[] }
  | { kind: "visible"; step: StepItem };

function buildSegments(steps: StepItem[]): Segment[] {
  const segments: Segment[] = [];
  let toggleBuf: StepItem[] = [];

  function flushToggle() {
    if (toggleBuf.length > 0) {
      segments.push({ kind: "toggle", steps: toggleBuf });
      toggleBuf = [];
    }
  }

  for (const step of steps) {
    if (isToggleOnlyStep(step)) {
      toggleBuf.push(step);
    } else {
      flushToggle();
      segments.push({ kind: "visible", step });
    }
  }
  flushToggle();
  return segments;
}

function renderToggleStep(step: StepItem): React.ReactNode {
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

  if (step.type === "context-group" && step.groupedSteps) {
    const Icon = step.toolIcon ?? Search;
    return (
      <BasicTool
        key={step.id}
        icon={Icon}
        trigger={{
          title: step.title ?? "Gathered context",
          subtitle: step.subtitle,
        }}
      >
        <div className="space-y-0.5">
          {step.groupedSteps.map((gs) => {
            const GsIcon = gs.toolIcon ?? Wrench;
            return (
              <BasicTool
                key={gs.id}
                icon={GsIcon}
                trigger={{
                  title: gs.title ?? gs.toolName ?? "Tool",
                  subtitle: gs.subtitle,
                  args: gs.args,
                }}
              >
                {gs.content}
              </BasicTool>
            );
          })}
        </div>
      </BasicTool>
    );
  }

  if (step.type === "todo") {
    return null;
  }

  return (
    <div key={step.id} className="text-xs text-muted-foreground pl-6 py-1">
      {step.text}
    </div>
  );
}

export function SessionTurn({
  userMessage,
  steps,
  diffs,
  working = false,
  statusText,
  duration,
  stepsExpanded = false,
  onToggleSteps,
  error,
  permissions,
  isActive = false,
  className,
}: SessionTurnProps) {
  const [throttledStatus, setThrottledStatus] = useState(statusText);
  const lastStatusUpdateRef = useRef(0);
  const statusTimerRef = useRef<ReturnType<typeof setTimeout> | undefined>(
    undefined,
  );

  useEffect(() => {
    if (!working) {
      setThrottledStatus(statusText);
      return;
    }

    const now = Date.now();
    const elapsed = now - lastStatusUpdateRef.current;

    if (elapsed >= 2500) {
      setThrottledStatus(statusText);
      lastStatusUpdateRef.current = now;
    } else {
      clearTimeout(statusTimerRef.current);
      statusTimerRef.current = setTimeout(() => {
        setThrottledStatus(statusText);
        lastStatusUpdateRef.current = Date.now();
      }, 2500 - elapsed);
    }

    return () => clearTimeout(statusTimerRef.current);
  }, [statusText, working]);

  const submitQuestionAnswer = async (
    requestID: string,
    answers: string[][],
  ) => {
    await chatClient.replyToQuestion({ requestID, answers });
  };

  // Reasoning steps are ephemeral: only visible while the AI is actively working.
  const visibleSteps = working
    ? steps
    : steps.filter((s) => s.type !== "reasoning");
  const displaySteps = visibleSteps.filter((s) => s.type !== "todo");

  const segments = buildSegments(displaySteps);
  const toggleOnlySteps = displaySteps.filter(isToggleOnlyStep);
  const hasUserMessage = userMessage.trim().length > 0;
  const canExpandSteps = toggleOnlySteps.length > 0;
  const hasSteps = working || canExpandSteps;

  const hasDiffs = !working && !!(diffs && diffs.length > 0);

  const renderVisibleStep = (step: StepItem) => {
    if (step.type === "text") {
      return (
        <div key={step.id} className="text-sm py-2">
          <MarkdownContent content={step.text ?? ""} />
        </div>
      );
    }

    if (step.type === "question") {
      let questionData: { requestId: string; questions: Question[] } | null =
        null;

      try {
        questionData = step.text
          ? (JSON.parse(step.text) as {
              requestId: string;
              questions: Question[];
            })
          : null;
      } catch {
        questionData = null;
      }

      if (!questionData) {
        return null;
      }

      return (
        <div key={step.id} className="py-2">
          <QuestionPrompt
            questions={questionData.questions}
            onSubmit={(answers) =>
              submitQuestionAnswer(questionData.requestId, answers)
            }
          />
        </div>
      );
    }

    return null;
  };

  return (
    <div
      data-component="session-turn"
      className={cn("flex flex-col", className)}
    >
      {hasUserMessage && (
        <div
          className={cn("z-10 bg-background pb-1", isActive && "sticky top-0")}
        >
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
            "z-[1] bg-background",
            isActive && "sticky",
            isActive && hasUserMessage ? "top-[28px]" : isActive ? "top-0" : "",
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
                ? throttledStatus || "Thinking"
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

      {segments.map((segment, idx) => {
        if (segment.kind === "visible") {
          return renderVisibleStep(segment.step);
        }

        if (!stepsExpanded) return null;

        return (
          <div key={`toggle-seg-${idx}`} className="py-1 space-y-0.5">
            {segment.steps.map(renderToggleStep)}
          </div>
        );
      })}

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

      {hasDiffs && diffs && (
        <div className="pt-4 space-y-3">
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
        </div>
      )}

      {error && (
        <div className="mt-3 p-3 rounded-lg border border-border bg-muted/20 text-sm text-muted-foreground">
          {error}
        </div>
      )}
    </div>
  );
}
