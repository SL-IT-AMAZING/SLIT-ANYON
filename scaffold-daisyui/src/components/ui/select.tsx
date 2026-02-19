import { cn } from "@/lib/utils";
import { type SelectHTMLAttributes, forwardRef } from "react";

export interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  variant?:
    | "bordered"
    | "ghost"
    | "primary"
    | "secondary"
    | "accent"
    | "info"
    | "success"
    | "warning"
    | "error";
  selectSize?: "xs" | "sm" | "md" | "lg";
}

const Select = forwardRef<HTMLSelectElement, SelectProps>(
  (
    { className, variant = "bordered", selectSize = "md", children, ...props },
    ref,
  ) => {
    return (
      <select
        className={cn(
          "select w-full",
          variant === "bordered" && "select-bordered",
          variant === "ghost" && "select-ghost",
          variant !== "bordered" && variant !== "ghost" && `select-${variant}`,
          selectSize !== "md" && `select-${selectSize}`,
          className,
        )}
        ref={ref}
        {...props}
      >
        {children}
      </select>
    );
  },
);
Select.displayName = "Select";

export { Select };
