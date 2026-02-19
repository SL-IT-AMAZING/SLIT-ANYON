import { cn } from "@/lib/utils";
import {
  type HTMLAttributes,
  type InputHTMLAttributes,
  forwardRef,
} from "react";

export interface TabsProps extends HTMLAttributes<HTMLDivElement> {
  variant?: "bordered" | "lifted" | "boxed";
  size?: "xs" | "sm" | "md" | "lg";
}

const Tabs = forwardRef<HTMLDivElement, TabsProps>(
  ({ className, variant, size = "md", children, ...props }, ref) => {
    return (
      <div
        role="tablist"
        className={cn(
          "tabs",
          variant && `tabs-${variant}`,
          size !== "md" && `tabs-${size}`,
          className,
        )}
        ref={ref}
        {...props}
      >
        {children}
      </div>
    );
  },
);
Tabs.displayName = "Tabs";

export interface TabProps extends InputHTMLAttributes<HTMLInputElement> {
  label: string;
  active?: boolean;
}

const Tab = forwardRef<HTMLInputElement, TabProps>(
  ({ className, label, active, name, ...props }, ref) => {
    return (
      <input
        type="radio"
        name={name}
        role="tab"
        className={cn("tab", active && "tab-active", className)}
        aria-label={label}
        ref={ref}
        {...props}
      />
    );
  },
);
Tab.displayName = "Tab";

const TabContent = forwardRef<HTMLDivElement, HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div
      role="tabpanel"
      className={cn("tab-content p-4", className)}
      ref={ref}
      {...props}
    />
  ),
);
TabContent.displayName = "TabContent";

export { Tabs, Tab, TabContent };
