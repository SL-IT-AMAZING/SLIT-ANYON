import { cn } from "@/lib/utils";
import { type ProgressHTMLAttributes, forwardRef } from "react";

export interface ProgressProps extends ProgressHTMLAttributes<HTMLProgressElement> {
  variant?:
    | "primary"
    | "secondary"
    | "accent"
    | "info"
    | "success"
    | "warning"
    | "error";
}

const Progress = forwardRef<HTMLProgressElement, ProgressProps>(
  ({ className, variant, ...props }, ref) => {
    return (
      <progress
        className={cn(
          "progress w-full",
          variant && `progress-${variant}`,
          className,
        )}
        ref={ref}
        {...props}
      />
    );
  },
);
Progress.displayName = "Progress";

export { Progress };
