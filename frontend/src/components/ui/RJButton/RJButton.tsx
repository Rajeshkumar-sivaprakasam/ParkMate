import React from "react";
import { cn } from "@/lib/utils";
import { RJSpinner } from "../RJSpinner";
import { buttonVariants, type RJButtonProps } from "./types";

/**
 * RJButton - A fully customizable button component
 * 
 * @example
 * ```tsx
 * // Basic usage
 * <RJButton>Click me</RJButton>
 * 
 * // With variant and size
 * <RJButton variant="outline" size="lg">Submit</RJButton>
 * 
 * // Loading state
 * <RJButton loading>Processing...</RJButton>
 * 
 * // With icons
 * <RJButton leftIcon={<Icon />}>Save</RJButton>
 * ```
 */
export const RJButton = React.forwardRef<HTMLButtonElement, RJButtonProps>(
  (
    {
      children,
      className,
      variant,
      size,
      fullWidth,
      loading = false,
      disabled = false,
      leftIcon,
      rightIcon,
      type = "button",
      ...props
    },
    ref
  ) => {
    // Determine if button should be disabled
    const isDisabled = disabled || loading;

    // Determine if we should use icon-only sizing
    const isIconOnly = size && String(size).startsWith("icon-");
    
    // Get the appropriate size for icon-only mode
    const iconSize = isIconOnly ? size : undefined;

    return (
      <button
        ref={ref}
        type={type}
        disabled={isDisabled}
        className={cn(
          buttonVariants({
            variant: isDisabled && !loading ? "ghost" : variant,
            size: isIconOnly ? iconSize : size,
            fullWidth,
          }),
          className
        )}
        aria-busy={loading}
        aria-disabled={isDisabled}
        {...props}
      >
        {/* Loading spinner or left icon */}
        {loading ? (
          <RJSpinner
            size={isIconOnly ? "sm" : "sm"}
            className="animate-spin"
          />
        ) : leftIcon ? (
          <span className="flex-shrink-0">{leftIcon}</span>
        ) : null}

        {/* Button text - hide for icon-only buttons */}
        {children && !isIconOnly && <span>{children}</span>}

        {/* Right icon (only if not loading and not icon-only) */}
        {rightIcon && !loading && !isIconOnly && (
          <span className="flex-shrink-0">{rightIcon}</span>
        )}
      </button>
    );
  }
);

// Display name for React DevTools
RJButton.displayName = "RJButton";

export default RJButton;
