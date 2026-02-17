import { cn } from "@/lib/utils";

import { ActionBar } from "./ActionBar";

interface AssistantMessageProps {
  content: string;
  isStreaming?: boolean;
  timestamp?: string;
  className?: string;
}

export function AssistantMessage({
  content,
  isStreaming = false,
  timestamp,
  className,
}: AssistantMessageProps) {
  return (
    <div
      className={cn(
        "group animate-in fade-in slide-in-from-bottom-1 relative w-full py-3 duration-150",
        className,
      )}
    >
      <div className="break-words px-2 text-sm leading-relaxed text-foreground">
        <span className="whitespace-pre-wrap">{content}</span>
        {isStreaming && (
          <span className="ml-0.5 inline-block animate-pulse text-muted-foreground">
            ▍
          </span>
        )}
      </div>

      {!isStreaming && (
        <div className="mt-2 flex items-center gap-2 px-2">
          <ActionBar showReload />
          {timestamp && (
            <span className="text-xs text-muted-foreground">{timestamp}</span>
          )}
        </div>
      )}
    </div>
  );
}
