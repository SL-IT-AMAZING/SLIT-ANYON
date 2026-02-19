import { cn } from "@/lib/utils";
import { type ButtonHTMLAttributes, forwardRef } from "react";

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?:
    | "primary"
    | "secondary"
    | "accent"
    | "ghost"
    | "link"
    | "outline"
    | "info"
    | "success"
    | "warning"
    | "error";
  size?: "xs" | "sm" | "md" | "lg";
  loading?: boolean;
  wide?: boolean;
  block?: boolean;
}

const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      className,
      variant = "primary",
      size = "md",
      loading,
      wide,
      block,
      children,
      ...props
    },
    ref,
  ) => {
    return (
      <button
        className={cn(
          "btn",
          variant !== "outline" && `btn-${variant}`,
          variant === "outline" && "btn-outline",
          size !== "md" && `btn-${size}`,
          loading && "loading",
          wide && "btn-wide",
          block && "btn-block",
          className,
        )}
        ref={ref}
        {...props}
      >
        {children}
      </button>
    );
  },
);
Button.displayName = "Button";

export { Button };
