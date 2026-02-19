import { cn } from "@/lib/utils";
import { type TextareaHTMLAttributes, forwardRef } from "react";

export interface TextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
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
  textareaSize?: "xs" | "sm" | "md" | "lg";
}

const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ className, variant = "bordered", textareaSize = "md", ...props }, ref) => {
    return (
      <textarea
        className={cn(
          "textarea w-full",
          variant === "bordered" && "textarea-bordered",
          variant === "ghost" && "textarea-ghost",
          variant !== "bordered" &&
            variant !== "ghost" &&
            `textarea-${variant}`,
          textareaSize !== "md" && `textarea-${textareaSize}`,
          className,
        )}
        ref={ref}
        {...props}
      />
    );
  },
);
Textarea.displayName = "Textarea";

export { Textarea };
