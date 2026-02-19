import { cn } from "@/lib/utils";
import { type HTMLAttributes, type LiHTMLAttributes, forwardRef } from "react";

const Breadcrumbs = forwardRef<HTMLDivElement, HTMLAttributes<HTMLDivElement>>(
  ({ className, children, ...props }, ref) => {
    return (
      <div
        className={cn("breadcrumbs text-sm", className)}
        ref={ref}
        {...props}
      >
        <ul>{children}</ul>
      </div>
    );
  },
);
Breadcrumbs.displayName = "Breadcrumbs";

const BreadcrumbItem = forwardRef<
  HTMLLIElement,
  LiHTMLAttributes<HTMLLIElement>
>(({ className, ...props }, ref) => (
  <li className={cn(className)} ref={ref} {...props} />
));
BreadcrumbItem.displayName = "BreadcrumbItem";

export { Breadcrumbs, BreadcrumbItem };
