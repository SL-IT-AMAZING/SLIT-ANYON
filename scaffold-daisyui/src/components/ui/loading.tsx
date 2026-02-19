import { cn } from "@/lib/utils";
import { type HTMLAttributes, forwardRef } from "react";

export interface LoadingProps extends HTMLAttributes<HTMLSpanElement> {
  variant?: "spinner" | "dots" | "ring" | "ball" | "bars" | "infinity";
  size?: "xs" | "sm" | "md" | "lg";
  color?:
    | "primary"
    | "secondary"
    | "accent"
    | "neutral"
    | "info"
    | "success"
    | "warning"
    | "error";
}

const Loading = forwardRef<HTMLSpanElement, LoadingProps>(
  ({ className, variant = "spinner", size = "md", color, ...props }, ref) => {
    return (
      <span
        className={cn(
          "loading",
          `loading-${variant}`,
          size !== "md" && `loading-${size}`,
          color && `text-${color}`,
          className,
        )}
        ref={ref}
        {...props}
      />
    );
  },
);
Loading.displayName = "Loading";

export { Loading };
