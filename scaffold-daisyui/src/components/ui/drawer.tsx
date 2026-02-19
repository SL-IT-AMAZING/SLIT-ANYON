import { cn } from "@/lib/utils";
import {
  type HTMLAttributes,
  type InputHTMLAttributes,
  forwardRef,
} from "react";

export interface DrawerProps extends HTMLAttributes<HTMLDivElement> {
  open?: boolean;
  end?: boolean;
}

const Drawer = forwardRef<HTMLDivElement, DrawerProps>(
  ({ className, open, end, children, ...props }, ref) => {
    return (
      <div
        className={cn("drawer", end && "drawer-end", className)}
        ref={ref}
        {...props}
      >
        {children}
      </div>
    );
  },
);
Drawer.displayName = "Drawer";

export interface DrawerToggleProps extends Omit<
  InputHTMLAttributes<HTMLInputElement>,
  "type"
> {
  drawerId: string;
}

const DrawerToggle = forwardRef<HTMLInputElement, DrawerToggleProps>(
  ({ drawerId, className, ...props }, ref) => (
    <input
      id={drawerId}
      type="checkbox"
      className={cn("drawer-toggle", className)}
      ref={ref}
      {...props}
    />
  ),
);
DrawerToggle.displayName = "DrawerToggle";

const DrawerContent = forwardRef<
  HTMLDivElement,
  HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div className={cn("drawer-content", className)} ref={ref} {...props} />
));
DrawerContent.displayName = "DrawerContent";

export interface DrawerSideProps extends HTMLAttributes<HTMLDivElement> {
  drawerId: string;
}

const DrawerSide = forwardRef<HTMLDivElement, DrawerSideProps>(
  ({ className, drawerId, children, ...props }, ref) => (
    <div className={cn("drawer-side", className)} ref={ref} {...props}>
      <label
        htmlFor={drawerId}
        aria-label="close sidebar"
        className="drawer-overlay"
      />
      {children}
    </div>
  ),
);
DrawerSide.displayName = "DrawerSide";

export { Drawer, DrawerToggle, DrawerContent, DrawerSide };
