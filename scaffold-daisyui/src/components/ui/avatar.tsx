import { cn } from "@/lib/utils";
import { type HTMLAttributes, type ImgHTMLAttributes, forwardRef } from "react";

export interface AvatarProps extends HTMLAttributes<HTMLDivElement> {
  online?: boolean;
  offline?: boolean;
  placeholder?: boolean;
}

const Avatar = forwardRef<HTMLDivElement, AvatarProps>(
  ({ className, online, offline, placeholder, children, ...props }, ref) => {
    return (
      <div
        className={cn(
          "avatar",
          online && "online",
          offline && "offline",
          placeholder && "placeholder",
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
Avatar.displayName = "Avatar";

export interface AvatarImageProps extends ImgHTMLAttributes<HTMLImageElement> {
  size?: number;
  rounded?: boolean;
  mask?: "squircle" | "hexagon" | "triangle" | "circle";
}

const AvatarImage = forwardRef<HTMLDivElement, AvatarImageProps>(
  ({ className, size = 12, rounded, mask, src, alt, ...props }, ref) => {
    return (
      <div
        className={cn(
          `w-${size}`,
          rounded && "rounded-full",
          mask && `mask mask-${mask}`,
          className,
        )}
        ref={ref}
      >
        <img src={src} alt={alt} {...props} />
      </div>
    );
  },
);
AvatarImage.displayName = "AvatarImage";

const AvatarGroup = forwardRef<HTMLDivElement, HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div
      className={cn("avatar-group -space-x-6 rtl:space-x-reverse", className)}
      ref={ref}
      {...props}
    />
  ),
);
AvatarGroup.displayName = "AvatarGroup";

export { Avatar, AvatarImage, AvatarGroup };
