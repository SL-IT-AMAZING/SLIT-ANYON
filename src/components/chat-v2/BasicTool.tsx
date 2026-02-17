import { cn } from "@/lib/utils";
import { Collapsible } from "@base-ui/react/collapsible";
import type { LucideIcon } from "lucide-react";
import { ChevronsUpDown, Wrench } from "lucide-react";
import { type ReactNode, useEffect, useState } from "react";

export type TriggerTitle = {
  title: string;
  titleClass?: string;
  subtitle?: string;
  subtitleClass?: string;
  args?: string[];
  argsClass?: string;
  action?: ReactNode;
};

export interface BasicToolProps {
  icon: LucideIcon;
  trigger: TriggerTitle | ReactNode;
  children?: ReactNode;
  hideDetails?: boolean;
  defaultOpen?: boolean;
  forceOpen?: boolean;
  locked?: boolean;
  onSubtitleClick?: () => void;
  className?: string;
}

function isTriggerTitle(val: unknown): val is TriggerTitle {
  return typeof val === "object" && val !== null && "title" in val;
}

export function BasicTool({
  icon: Icon,
  trigger,
  children,
  hideDetails,
  defaultOpen = false,
  forceOpen,
  locked,
  onSubtitleClick,
  className,
}: BasicToolProps) {
  const [open, setOpen] = useState(defaultOpen);

  useEffect(() => {
    if (forceOpen) {
      setOpen(true);
    }
  }, [forceOpen]);

  const hasExpandableContent = children != null && !hideDetails;
  const showChevron = hasExpandableContent && !locked;

  function handleOpenChange(nextOpen: boolean) {
    if (locked && !nextOpen) {
      return;
    }
    setOpen(nextOpen);
  }

  return (
    <Collapsible.Root
      open={open}
      onOpenChange={handleOpenChange}
      className={cn("group/tool", className)}
    >
      <Collapsible.Trigger
        className={cn(
          "flex w-full items-center gap-2 py-1 text-left outline-none",
          hasExpandableContent &&
            !locked &&
            "cursor-pointer rounded hover:bg-muted/30",
          !hasExpandableContent && "cursor-default",
        )}
        disabled={!hasExpandableContent}
      >
        <Icon className="size-4 shrink-0 text-muted-foreground" />

        {isTriggerTitle(trigger) ? (
          <div className="flex min-w-0 flex-1 items-center gap-2">
            <span
              className={cn(
                "shrink-0 text-sm font-medium text-foreground",
                trigger.titleClass,
              )}
            >
              {trigger.title}
            </span>

            {trigger.subtitle != null && (
              <span
                className={cn(
                  "min-w-0 truncate text-xs text-muted-foreground",
                  onSubtitleClick &&
                    "cursor-pointer underline decoration-muted-foreground/40 hover:decoration-muted-foreground",
                  trigger.subtitleClass,
                )}
                onClick={
                  onSubtitleClick
                    ? (e) => {
                        e.stopPropagation();
                        onSubtitleClick();
                      }
                    : undefined
                }
              >
                {trigger.subtitle}
              </span>
            )}

            {trigger.args?.map((arg) => (
              <span
                key={arg}
                className={cn(
                  "shrink-0 text-xs font-mono text-muted-foreground",
                  trigger.argsClass,
                )}
              >
                {arg}
              </span>
            ))}

            {trigger.action != null && (
              <span className="shrink-0">{trigger.action}</span>
            )}
          </div>
        ) : (
          <div className="flex min-w-0 flex-1 items-center gap-2">
            {trigger}
          </div>
        )}

        {showChevron && (
          <ChevronsUpDown className="size-3.5 shrink-0 text-muted-foreground" />
        )}
      </Collapsible.Trigger>

      {hasExpandableContent && (
        <Collapsible.Panel className="data-closed:animate-accordion-up data-open:animate-accordion-down overflow-hidden">
          <div className="pl-6 pt-1 pb-2">{children}</div>
        </Collapsible.Panel>
      )}
    </Collapsible.Root>
  );
}

export function GenericTool({
  tool,
  hideDetails,
}: {
  tool: string;
  hideDetails?: boolean;
}) {
  return (
    <BasicTool
      icon={Wrench}
      trigger={{ title: tool }}
      hideDetails={hideDetails}
    />
  );
}
