import type { Problem } from "@/ipc/types";
import {
  AlertTriangle,
  ChevronsDownUp,
  ChevronsUpDown,
  FileText,
} from "lucide-react";
import React, { useState } from "react";

type ProblemWithoutSnippet = Omit<Problem, "snippet">;

interface DyadProblemSummaryProps {
  summary?: string;
  children?: React.ReactNode;
}

interface ProblemItemProps {
  problem: ProblemWithoutSnippet;
  index: number;
}

const ProblemItem: React.FC<ProblemItemProps> = ({ problem, index }) => {
  return (
    <div className="flex items-start gap-3 py-2 px-3 border-b border-border last:border-b-0">
      <div className="flex-shrink-0 w-6 h-6 rounded-full bg-muted flex items-center justify-center mt-0.5">
        <span className="text-xs font-medium text-muted-foreground">
          {index + 1}
        </span>
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-2">
          <FileText size={14} className="text-muted-foreground flex-shrink-0" />
          <span className="text-sm font-medium text-foreground truncate">
            {problem.file}
          </span>

          <span className="text-xs text-muted-foreground">
            {problem.line}:{problem.column}
          </span>
          <span className="text-xs bg-muted px-2 py-0.5 rounded text-muted-foreground">
            TS{problem.code}
          </span>
        </div>
        <p className="text-sm text-muted-foreground leading-relaxed">
          {problem.message}
        </p>
      </div>
    </div>
  );
};

export const DyadProblemSummary: React.FC<DyadProblemSummaryProps> = ({
  summary,
  children,
}) => {
  const [isContentVisible, setIsContentVisible] = useState(false);

  // Parse problems from children content if available
  const problems: ProblemWithoutSnippet[] = React.useMemo(() => {
    if (!children || typeof children !== "string") return [];

    // Parse structured format with <problem> tags
    const problemTagRegex =
      /<problem\s+file="([^"]+)"\s+line="(\d+)"\s+column="(\d+)"\s+code="(\d+)">([^<]+)<\/problem>/g;
    const problems: ProblemWithoutSnippet[] = [];
    let match;

    while ((match = problemTagRegex.exec(children)) !== null) {
      try {
        problems.push({
          file: match[1],
          line: Number.parseInt(match[2], 10),
          column: Number.parseInt(match[3], 10),
          message: match[5].trim(),
          code: Number.parseInt(match[4], 10),
        });
      } catch {
        return [
          {
            file: "unknown",
            line: 0,
            column: 0,
            message: children,
            code: 0,
          },
        ];
      }
    }

    return problems;
  }, [children]);

  const totalProblems = problems.length;
  const displaySummary =
    summary || `${totalProblems} problems found (TypeScript errors)`;

  return (
    <div
      className="bg-(--background-lightest) hover:bg-(--background-lighter) rounded-lg px-4 py-2 border border-border my-2 cursor-pointer"
      onClick={() => setIsContentVisible(!isContentVisible)}
      data-testid="problem-summary"
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <AlertTriangle
            size={16}
            className="text-amber-600 dark:text-amber-500"
          />
          <span className="text-muted-foreground font-medium text-sm">
            <span className="font-bold mr-2 outline-2 outline-amber-200 dark:outline-amber-700 bg-amber-100 dark:bg-amber-900/30 text-amber-800 dark:text-amber-200 rounded-md px-1">
              Auto-fix
            </span>
            {displaySummary}
          </span>
        </div>
        <div className="flex items-center">
          {isContentVisible ? (
            <ChevronsDownUp
              size={20}
              className="text-muted-foreground hover:text-accent-foreground"
            />
          ) : (
            <ChevronsUpDown
              size={20}
              className="text-muted-foreground hover:text-accent-foreground"
            />
          )}
        </div>
      </div>

      {/* Content area - show individual problems */}
      {isContentVisible && totalProblems > 0 && (
        <div className="mt-4">
           <div className="bg-card rounded-lg border border-border overflow-hidden">
            {problems.map((problem, index) => (
              <ProblemItem
                key={`${problem.file}-${problem.line}-${problem.column}-${index}`}
                problem={problem}
                index={index}
              />
            ))}
          </div>
        </div>
      )}

      {/* Fallback content area for raw children */}
      {isContentVisible && totalProblems === 0 && children && (
        <div className="mt-4 text-sm text-foreground">
          <pre className="whitespace-pre-wrap font-mono text-xs bg-muted p-3 rounded">
            {children}
          </pre>
        </div>
      )}
    </div>
  );
};
