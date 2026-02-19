import { cn } from "@/lib/utils";
import { type HTMLAttributes, forwardRef } from "react";

export interface CollapseProps extends HTMLAttributes<HTMLDivElement> {
  variant?: "arrow" | "plus";
  open?: boolean;
}

const Collapse = forwardRef<HTMLDivElement, CollapseProps>(
  ({ className, variant, open, children, ...props }, ref) => {
    return (
      <div
        tabIndex={0}
        className={cn(
          "collapse bg-base-200",
          variant === "arrow" && "collapse-arrow",
          variant === "plus" && "collapse-plus",
          open && "collapse-open",
          className,
        )}
        ref={ref}
        {...props}
      >
        {children}
      </div>
    );
  },
);
Collapse.displayName = "Collapse";

const CollapseTitle = forwardRef<
  HTMLDivElement,
  HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    className={cn("collapse-title text-xl font-medium", className)}
    ref={ref}
    {...props}
  />
));
CollapseTitle.displayName = "CollapseTitle";

const CollapseContent = forwardRef<
  HTMLDivElement,
  HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div className={cn("collapse-content", className)} ref={ref} {...props} />
));
CollapseContent.displayName = "CollapseContent";

export { Collapse, CollapseTitle, CollapseContent };
