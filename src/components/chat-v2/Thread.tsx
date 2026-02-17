import type { ReactNode } from "react";

import { cn } from "@/lib/utils";

interface ThreadProps {
  children?: ReactNode;
  className?: string;
}

export function Thread({ children, className }: ThreadProps) {
  return (
    <div
      className={cn("flex h-full flex-col bg-background", className)}
      style={{ "--thread-max-width": "44rem" } as React.CSSProperties}
    >
      {children}
    </div>
  );
}

interface ThreadViewportProps {
  children?: ReactNode;
  className?: string;
}

export function ThreadViewport({ children, className }: ThreadViewportProps) {
  return (
    <div
      className={cn(
        "flex flex-1 flex-col overflow-x-hidden overflow-y-auto scroll-smooth px-4 pt-4",
        className,
      )}
    >
      {children}
    </div>
  );
}

interface ThreadMessagesProps {
  children?: ReactNode;
  className?: string;
}

export function ThreadMessages({ children, className }: ThreadMessagesProps) {
  return (
    <div
      className={cn(
        "mx-auto flex w-full max-w-[var(--thread-max-width)] flex-col gap-1",
        className,
      )}
    >
      {children}
    </div>
  );
}

interface ThreadFooterProps {
  children?: ReactNode;
  className?: string;
}

export function ThreadFooter({ children, className }: ThreadFooterProps) {
  return (
    <div
      className={cn(
        "sticky bottom-0 mx-auto mt-auto flex w-full max-w-[var(--thread-max-width)] flex-col gap-4 overflow-visible rounded-t-3xl bg-background pb-4 md:pb-6",
        className,
      )}
    >
      {children}
    </div>
  );
}

interface ThreadWelcomeProps {
  title?: string;
  subtitle?: string;
  className?: string;
}

export function ThreadWelcome({
  title = "How can I help you?",
  subtitle,
  className,
}: ThreadWelcomeProps) {
  return (
    <div
      className={cn(
        "flex flex-1 flex-col items-center justify-center gap-2 px-4",
        className,
      )}
    >
      <h1 className="animate-in fade-in fill-mode-both text-2xl font-semibold text-foreground duration-200">
        {title}
      </h1>
      {subtitle && (
        <p className="animate-in fade-in fill-mode-both text-sm text-muted-foreground delay-150 duration-200">
          {subtitle}
        </p>
      )}
    </div>
  );
}
