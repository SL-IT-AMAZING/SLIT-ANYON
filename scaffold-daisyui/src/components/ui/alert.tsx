import { cn } from "@/lib/utils";
import { type HTMLAttributes, forwardRef } from "react";

export interface AlertProps extends HTMLAttributes<HTMLDivElement> {
  variant?: "info" | "success" | "warning" | "error";
}

const Alert = forwardRef<HTMLDivElement, AlertProps>(
  ({ className, variant, children, ...props }, ref) => {
    return (
      <div
        role="alert"
        className={cn("alert", variant && `alert-${variant}`, className)}
        ref={ref}
        {...props}
      >
        {children}
      </div>
    );
  },
);
Alert.displayName = "Alert";

export { Alert };
