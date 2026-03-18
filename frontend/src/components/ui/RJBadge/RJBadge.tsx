import React from "react";
import { cn } from "@/lib/utils";
import { badgeVariants, type RJBadgeProps } from "./types";

/**
 * Dot color mappings
 */
const dotColorClasses = {
  default: "bg-gray-500",
  success: "bg-green-500",
  warning: "bg-amber-500",
  danger: "bg-red-500",
  info: "bg-cyan-500",
};

/**
 * RJBadge - A fully customizable badge component
 * 
 * @example
 * ```tsx
 * // Basic usage
 * <RJBadge>New</RJBadge>
 * 
 * // With variant
 * <RJBadge variant="success">Active</RJBadge>
 * 
 * // With size
 * <RJBadge size="sm">Pending</RJBadge>
 * 
 * // Dot badge
 * <RJBadge dot dotColor="success">Online</RJBadge>
 * ```
 */
export const RJBadge = React.forwardRef<HTMLSpanElement, RJBadgeProps>(
  ({ className, size, variant, children, dot, dotColor = "default", ...props }, ref) => {
    // If dot mode, render just the dot
    if (dot) {
      return (
        <span
          ref={ref}
          className={cn(
            "relative flex items-center gap-1.5",
            className
          )}
          {...props}
        >
          <span
            className={cn(
              "h-2 w-2 rounded-full",
              dotColorClasses[dotColor]
            )}
          />
          {children && <span>{children}</span>}
        </span>
      );
    }

    return (
      <span
        ref={ref}
        className={cn(
          badgeVariants({
            size,
            variant,
          }),
          className
        )}
        {...props}
      >
        {children}
      </span>
    );
  }
);

// Display name for React DevTools
RJBadge.displayName = "RJBadge";

export default RJBadge;
