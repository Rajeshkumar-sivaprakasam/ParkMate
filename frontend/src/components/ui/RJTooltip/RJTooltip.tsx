import React, { useState, useCallback } from "react";
import { cn } from "@/lib/utils";
import {
  tooltipVariants,
  tooltipPositions,
  arrowPositions,
  arrowColorVariants,
  type RJTooltipProps,
} from "./types";

/**
 * RJTooltip - A fully customizable tooltip component
 * 
 * @example
 * ```tsx
 * // Basic usage
 * <RJTooltip content="This is a tooltip">
 *   <Button>Hover me</Button>
 * </RJTooltip>
 * 
 * // With position
 * <RJTooltip content="Right tooltip" position="right">
 *   <Button>Hover me</Button>
 * </RJTooltip>
 * 
 * // With variant
 * <RJTooltip content="Success tooltip" variant="success">
 *   <Button>Hover me</Button>
 * </RJTooltip>
 * ```
 */
export const RJTooltip: React.FC<RJTooltipProps> = ({
  content,
  position = "top",
  variant = "default",
  showArrow = true,
  delay = 200,
  disabled = false,
  children,
}) => {
  const [isVisible, setIsVisible] = useState(false);
  let timeoutId: ReturnType<typeof setTimeout>;

  // Show tooltip after delay
  const handleMouseEnter = useCallback(() => {
    if (disabled) return;
    timeoutId = setTimeout(() => {
      setIsVisible(true);
    }, delay);
  }, [delay, disabled]);

  // Hide tooltip
  const handleMouseLeave = useCallback(() => {
    if (timeoutId) {
      clearTimeout(timeoutId);
    }
    setIsVisible(false);
  }, []);

  // Determine if position is horizontal (left/right)
  const isHorizontal = position === "left" || position === "right";

  return (
    <div
      className="relative inline-flex"
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      {/* Trigger element */}
      {children}

      {/* Tooltip */}
      {isVisible && !disabled && (
        <div
          className={cn(
            "absolute z-50 whitespace-nowrap animate-in fade-in-0 zoom-in-95 slide-in-from-50%",
            tooltipPositions[position]
          )}
          role="tooltip"
        >
          {/* Tooltip content */}
          <div
            className={cn(
              tooltipVariants({
                variant,
              })
            )}
          >
            {content}
          </div>

          {/* Arrow */}
          {showArrow && (
            <span
              className={cn(
                "absolute w-0 h-0 border-l-8 border-r-8 border-transparent",
                arrowPositions[position],
                arrowColorVariants[variant || "default"]
              )}
            />
          )}
        </div>
      )}
    </div>
  );
};

// Display name for React DevTools
RJTooltip.displayName = "RJTooltip";

export default RJTooltip;
