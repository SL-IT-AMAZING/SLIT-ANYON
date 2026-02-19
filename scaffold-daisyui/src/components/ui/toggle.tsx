import { cn } from "@/lib/utils";
import { type InputHTMLAttributes, forwardRef } from "react";

export interface ToggleProps extends Omit<
  InputHTMLAttributes<HTMLInputElement>,
  "type" | "size"
> {
  variant?:
    | "primary"
    | "secondary"
    | "accent"
    | "info"
    | "success"
    | "warning"
    | "error";
  toggleSize?: "xs" | "sm" | "md" | "lg";
}

const Toggle = forwardRef<HTMLInputElement, ToggleProps>(
  ({ className, variant, toggleSize = "md", ...props }, ref) => {
    return (
      <input
        type="checkbox"
        className={cn(
          "toggle",
          variant && `toggle-${variant}`,
          toggleSize !== "md" && `toggle-${toggleSize}`,
          className,
        )}
        ref={ref}
        {...props}
      />
    );
  },
);
Toggle.displayName = "Toggle";

export { Toggle };
