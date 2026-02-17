import { cn } from "@/lib/utils";
import { ArrowUp, Square } from "lucide-react";
import { type KeyboardEvent, useCallback, useEffect, useRef } from "react";

interface ComposerProps {
  value?: string;
  onChange?: (value: string) => void;
  onSend?: () => void;
  onStop?: () => void;
  isStreaming?: boolean;
  placeholder?: string;
  disabled?: boolean;
  className?: string;
}

const MAX_HEIGHT = 200;

export function Composer({
  value = "",
  onChange,
  onSend,
  onStop,
  isStreaming = false,
  placeholder = "Ask anything...",
  disabled = false,
  className,
}: ComposerProps) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const adjustHeight = useCallback(() => {
    const textarea = textareaRef.current;
    if (!textarea) return;
    textarea.style.height = "auto";
    textarea.style.height = `${Math.min(textarea.scrollHeight, MAX_HEIGHT)}px`;
  }, []);

  useEffect(() => {
    adjustHeight();
  }, [value, adjustHeight]);

  const handleKeyDown = useCallback(
    (e: KeyboardEvent<HTMLTextAreaElement>) => {
      if (e.key === "Enter" && !e.shiftKey) {
        e.preventDefault();
        if (!isStreaming && value.trim().length > 0) {
          onSend?.();
        }
      }
    },
    [isStreaming, value, onSend],
  );

  const canSend = value.trim().length > 0;

  return (
    <div
      className={cn(
        "rounded-2xl border border-input bg-background shadow-sm",
        disabled && "opacity-50 pointer-events-none",
        className,
      )}
    >
      <textarea
        ref={textareaRef}
        value={value}
        onChange={(e) => onChange?.(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder={placeholder}
        disabled={disabled}
        rows={1}
        className="min-h-14 w-full resize-none bg-transparent px-4 pt-3 pb-2 text-sm placeholder:text-muted-foreground focus:outline-none"
        style={{ maxHeight: MAX_HEIGHT }}
      />

      <div className="flex items-center justify-end px-3 pb-3">
        {isStreaming ? (
          <button
            type="button"
            onClick={onStop}
            className="flex size-8 items-center justify-center rounded-full border border-border bg-background transition-colors hover:bg-muted"
          >
            <Square className="size-2.5 fill-current" />
          </button>
        ) : (
          <button
            type="button"
            onClick={onSend}
            disabled={!canSend}
            className={cn(
              "flex size-8 items-center justify-center rounded-full bg-foreground text-background transition-colors hover:bg-foreground/90",
              !canSend && "opacity-30 pointer-events-none",
            )}
          >
            <ArrowUp className="size-4" />
          </button>
        )}
      </div>
    </div>
  );
}
