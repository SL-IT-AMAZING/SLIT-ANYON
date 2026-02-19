import { cn } from "@/lib/utils";
import { type HTMLAttributes, forwardRef } from "react";

export interface CardProps extends HTMLAttributes<HTMLDivElement> {
  variant?: "normal" | "compact" | "side";
  bordered?: boolean;
  imageFull?: boolean;
}

const Card = forwardRef<HTMLDivElement, CardProps>(
  (
    {
      className,
      variant = "normal",
      bordered = true,
      imageFull,
      children,
      ...props
    },
    ref,
  ) => {
    return (
      <div
        className={cn(
          "card bg-base-100 shadow-xl",
          bordered && "card-bordered",
          variant === "compact" && "card-compact",
          variant === "side" && "card-side",
          imageFull && "image-full",
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
Card.displayName = "Card";

const CardBody = forwardRef<HTMLDivElement, HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div className={cn("card-body", className)} ref={ref} {...props} />
  ),
);
CardBody.displayName = "CardBody";

const CardTitle = forwardRef<
  HTMLHeadingElement,
  HTMLAttributes<HTMLHeadingElement>
>(({ className, ...props }, ref) => (
  <h2 className={cn("card-title", className)} ref={ref} {...props} />
));
CardTitle.displayName = "CardTitle";

const CardActions = forwardRef<HTMLDivElement, HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div
      className={cn("card-actions justify-end", className)}
      ref={ref}
      {...props}
    />
  ),
);
CardActions.displayName = "CardActions";

export { Card, CardBody, CardTitle, CardActions };
