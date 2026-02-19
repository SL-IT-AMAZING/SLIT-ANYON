import { cn } from "@/lib/utils";
import { type HTMLAttributes, forwardRef } from "react";

export interface TooltipProps extends HTMLAttributes<HTMLDivElement> {
  tip: string;
  position?: "top" | "bottom" | "left" | "right";
  variant?:
    | "primary"
    | "secondary"
    | "accent"
    | "info"
    | "success"
    | "warning"
    | "error";
  open?: boolean;
}

const Tooltip = forwardRef<HTMLDivElement, TooltipProps>(
  ({ className, tip, position, variant, open, children, ...props }, ref) => {
    return (
      <div
        className={cn(
          "tooltip",
          position && `tooltip-${position}`,
          variant && `tooltip-${variant}`,
          open && "tooltip-open",
          className,
        )}
        data-tip={tip}
        ref={ref}
        {...props}
      >
        {children}
      </div>
    );
  },
);
Tooltip.displayName = "Tooltip";

export { Tooltip };
