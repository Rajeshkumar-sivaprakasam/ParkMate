import React from "react";
import { cn } from "@/lib/utils";
import { spinnerVariants, type RJSpinnerProps } from "./types";

/**
 * RJSpinner - A customizable loading spinner component
 * 
 * @example
 * ```tsx
 * // Basic usage
 * <RJSpinner />
 * 
 * // With size
 * <RJSpinner size="lg" />
 * 
 * // With variant color
 * <RJSpinner variant="white" />
 * 
 * // Inside a button
 * <RJButton>
 *   <RJSpinner size="sm" />
 *   Loading...
 * </RJButton>
 * ```
 */
export const RJSpinner = React.forwardRef<HTMLDivElement, RJSpinnerProps>(
  ({ className, size, variant, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn(spinnerVariants({ size, variant }), className)}
        role="status"
        aria-label="Loading"
        {...props}
      >
        {/* SVG spinner - circle with gap */}
        <svg
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
          className="w-full h-full"
        >
          <circle
            className="opacity-25"
            cx="12"
            cy="12"
            r="10"
            stroke="currentColor"
            strokeWidth="4"
          />
          <path
            className="opacity-75"
            fill="currentColor"
            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
          />
        </svg>
        {/* Hidden text for screen readers */}
        <span className="sr-only">Loading...</span>
      </div>
    );
  }
);

// Display name for React DevTools
RJSpinner.displayName = "RJSpinner";

export default RJSpinner;
