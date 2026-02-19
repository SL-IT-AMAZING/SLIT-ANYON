import { cn } from "@/lib/utils";
import { type InputHTMLAttributes, forwardRef } from "react";

export interface CheckboxProps extends Omit<
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
  checkboxSize?: "xs" | "sm" | "md" | "lg";
}

const Checkbox = forwardRef<HTMLInputElement, CheckboxProps>(
  ({ className, variant, checkboxSize = "md", ...props }, ref) => {
    return (
      <input
        type="checkbox"
        className={cn(
          "checkbox",
          variant && `checkbox-${variant}`,
          checkboxSize !== "md" && `checkbox-${checkboxSize}`,
          className,
        )}
        ref={ref}
        {...props}
      />
    );
  },
);
Checkbox.displayName = "Checkbox";

export { Checkbox };
