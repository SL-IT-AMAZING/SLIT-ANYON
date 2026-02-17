import type { ReactNode } from "react";
import { useMemo } from "react";
import { AlertTriangle } from "lucide-react";
import { ToolCallCard } from "./ToolCallCard";

interface Problem {
  file: string;
  line: string;
  column: string;
  code: string;
  message: string;
}

interface ProblemSummaryToolProps {
  summary?: string;
  children?: ReactNode;
  className?: string;
}

function parseProblems(text: string): Problem[] {
  const problems: Problem[] = [];
  const regex =
    /<problem\s+file="([^"]*)"\s+line="([^"]*)"\s+column="([^"]*)"\s+code="([^"]*)"\s+message="([^"]*)"[^/]*\/>/g;
  let match: RegExpExecArray | null;
  while ((match = regex.exec(text)) !== null) {
    problems.push({
      file: match[1],
      line: match[2],
      column: match[3],
      code: match[4],
      message: match[5],
    });
  }
  return problems;
}

export function ProblemSummaryTool({
  summary,
  children,
  className,
}: ProblemSummaryToolProps) {
  const text = typeof children === "string" ? children : "";

  const problems = useMemo(() => parseProblems(text), [text]);

  const subtitle =
    summary ||
    (problems.length > 0 ? `${problems.length} problems found` : undefined);

  return (
    <ToolCallCard
      icon={AlertTriangle}
      title="Auto-fix"
      subtitle={subtitle}
      className={className}
    >
      {problems.length > 0 ? (
        <div className="space-y-2">
          {problems.map((p, i) => (
            <div
              key={i}
              className="flex items-start gap-2 text-xs text-muted-foreground"
            >
              <span className="font-mono">
                {p.file}:{p.line}:{p.column}
              </span>
              <span>TS{p.code}</span>
              <span>{p.message}</span>
            </div>
          ))}
        </div>
      ) : null}
    </ToolCallCard>
  );
}
