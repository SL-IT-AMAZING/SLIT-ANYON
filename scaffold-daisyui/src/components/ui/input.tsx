import { cn } from "@/lib/utils";
import { type InputHTMLAttributes, forwardRef } from "react";

export interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
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
  inputSize?: "xs" | "sm" | "md" | "lg";
}

const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ className, variant = "bordered", inputSize = "md", ...props }, ref) => {
    return (
      <input
        className={cn(
          "input w-full",
          variant === "bordered" && "input-bordered",
          variant === "ghost" && "input-ghost",
          variant !== "bordered" && variant !== "ghost" && `input-${variant}`,
          inputSize !== "md" && `input-${inputSize}`,
          className,
        )}
        ref={ref}
        {...props}
      />
    );
  },
);
Input.displayName = "Input";

export { Input };
