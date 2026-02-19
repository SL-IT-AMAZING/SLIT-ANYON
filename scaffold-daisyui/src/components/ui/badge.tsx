import { cn } from "@/lib/utils";
import { type HTMLAttributes, forwardRef } from "react";

export interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  variant?:
    | "primary"
    | "secondary"
    | "accent"
    | "ghost"
    | "outline"
    | "info"
    | "success"
    | "warning"
    | "error"
    | "neutral";
  size?: "xs" | "sm" | "md" | "lg";
}

const Badge = forwardRef<HTMLSpanElement, BadgeProps>(
  ({ className, variant, size = "md", children, ...props }, ref) => {
    return (
      <span
        className={cn(
          "badge",
          variant &&
            (variant === "outline" ? "badge-outline" : `badge-${variant}`),
          size !== "md" && `badge-${size}`,
          className,
        )}
        ref={ref}
        {...props}
      >
        {children}
      </span>
    );
  },
);
Badge.displayName = "Badge";

export { Badge };
