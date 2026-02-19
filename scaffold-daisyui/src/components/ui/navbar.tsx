import { cn } from "@/lib/utils";
import { type HTMLAttributes, forwardRef } from "react";

const Navbar = forwardRef<HTMLDivElement, HTMLAttributes<HTMLDivElement>>(
  ({ className, children, ...props }, ref) => {
    return (
      <div className={cn("navbar bg-base-100", className)} ref={ref} {...props}>
        {children}
      </div>
    );
  },
);
Navbar.displayName = "Navbar";

const NavbarStart = forwardRef<HTMLDivElement, HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div className={cn("navbar-start", className)} ref={ref} {...props} />
  ),
);
NavbarStart.displayName = "NavbarStart";

const NavbarCenter = forwardRef<HTMLDivElement, HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div className={cn("navbar-center", className)} ref={ref} {...props} />
  ),
);
NavbarCenter.displayName = "NavbarCenter";

const NavbarEnd = forwardRef<HTMLDivElement, HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div className={cn("navbar-end", className)} ref={ref} {...props} />
  ),
);
NavbarEnd.displayName = "NavbarEnd";

export { Navbar, NavbarStart, NavbarCenter, NavbarEnd };
