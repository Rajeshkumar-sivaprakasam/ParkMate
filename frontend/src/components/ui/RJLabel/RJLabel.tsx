import React from "react";
import { cn } from "@/lib/utils";
import { labelVariants, type RJLabelProps } from "./types";

/**
 * RJLabel - A fully customizable label component
 * 
 * @example
 * ```tsx
 * // Basic usage
 * <RJLabel>Username</RJLabel>
 * 
 * // With required indicator
 * <RJLabel required>Email</RJLabel>
 * 
 * // With error state
 * <RJLabel error>Password</RJLabel>
 * 
 * // With custom variant
 * <RJLabel variant="muted">Optional field</RJLabel>
 * ```
 */
export const RJLabel = React.forwardRef<HTMLLabelElement, RJLabelProps>(
  ({ className, size, variant, required, disabled, children, ...props }, ref) => {
    return (
      <label
        ref={ref}
        className={cn(
          labelVariants({
            size,
            variant: disabled ? "muted" : variant,
          }),
          className
        )}
        {...props}
      >
        {children}
        {required && (
          <span className="text-red-500 ml-0.5" aria-hidden="true">
            *
          </span>
        )}
      </label>
    );
  }
);

// Display name for React DevTools
RJLabel.displayName = "RJLabel";

export default RJLabel;
