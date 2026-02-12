import { Brain, ChevronsDownUp, ChevronsUpDown, Loader2 } from "lucide-react";
import { useEffect, useState } from "react";
import { VanillaMarkdownParser } from "./AnyonMarkdownParser";
import { AnyonTokenSavings } from "./AnyonTokenSavings";
import type { CustomTagState } from "./stateTypes";

interface AnyonThinkProps {
  node?: { properties?: { state?: CustomTagState } };
  children?: React.ReactNode;
}

export const AnyonThink: React.FC<AnyonThinkProps> = ({ children, node }) => {
  const state = node?.properties?.state;
  const inProgress = state === "pending";
  const [expanded, setExpanded] = useState(inProgress);

  useEffect(() => {
    if (!inProgress) {
      setExpanded(false);
    }
  }, [inProgress]);

  const tokenSavingsMatch =
    typeof children === "string"
      ? children.match(
          /^anyon-token-savings\?original-tokens=([0-9.]+)&smart-context-tokens=([0-9.]+)$/,
        )
      : null;

  if (tokenSavingsMatch) {
    const originalTokens = Number.parseFloat(tokenSavingsMatch[1]);
    const smartContextTokens = Number.parseFloat(tokenSavingsMatch[2]);
    return (
      <AnyonTokenSavings
        originalTokens={originalTokens}
        smartContextTokens={smartContextTokens}
      />
    );
  }

  const hasContent =
    typeof children === "string" ? children.trim().length > 0 : !!children;

  if (!hasContent) {
    return null;
  }

  const borderClass = inProgress
    ? "border-(--primary)"
    : "border-(--primary)/30";

  return (
    <div
      data-testid="anyon-think"
      className={`bg-(--background-lightest) hover:bg-(--background-lighter) rounded-lg px-4 py-2 border my-2 cursor-pointer ${borderClass}`}
      onClick={() => setExpanded(!expanded)}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          setExpanded(!expanded);
        }
      }}
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Brain size={16} className="text-(--primary)" />
          <span className="text-muted-foreground font-medium text-sm">
            Thinking
          </span>
          {inProgress && (
            <div className="flex items-center text-(--primary) text-xs">
              <Loader2 size={14} className="mr-1 animate-spin" />
            </div>
          )}
        </div>
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
      {expanded && (
        <div className="mt-2 text-sm text-muted-foreground italic">
          {typeof children === "string" ? (
            <VanillaMarkdownParser content={children} />
          ) : (
            children
          )}
        </div>
      )}
    </div>
  );
};
