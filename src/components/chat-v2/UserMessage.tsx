import { cn } from "@/lib/utils";

interface UserMessageProps {
  content: string;
  timestamp?: string;
  className?: string;
}

export function UserMessage({
  content,
  timestamp,
  className,
}: UserMessageProps) {
  return (
    <div
      className={cn(
        "grid grid-cols-[minmax(72px,1fr)_auto] gap-y-2",
        className,
      )}
    >
      <div />
      <div className="rounded-2xl bg-muted px-4 py-2.5">
        <p className="whitespace-pre-wrap break-words text-sm text-foreground">
          {content}
        </p>
      </div>
      {timestamp && (
        <>
          <div />
          <p className="pr-1 text-xs text-muted-foreground">{timestamp}</p>
        </>
      )}
    </div>
  );
}
