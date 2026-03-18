import React from "react";
import { TrendingUp, TrendingDown, Minus } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  statCardVariants,
  iconColorVariants,
  trendColorVariants,
  type RJStatCardProps,
} from "./types";

/**
 * Icon size mappings
 */
const iconSizes = {
  sm: "w-8 h-8",
  md: "w-10 h-10",
  lg: "w-12 h-12",
};

const iconInnerSizes = {
  sm: "w-4 h-4",
  md: "w-5 h-5",
  lg: "w-6 h-6",
};

/**
 * RJStatCard - A fully customizable statistics card component
 * 
 * @example
 * ```tsx
 * // Basic usage
 * <RJStatCard 
 *   title="Total Users" 
 *   value="1,234" 
 *   icon={Users} 
 *   iconColor="primary" 
 * />
 * 
 * // With trend
 * <RJStatCard 
 *   title="Revenue" 
 *   value="$12,345" 
 *   icon={DollarSign} 
 *   iconColor="success"
 *   trend="up"
 *   trendValue="+12.5%"
 * />
 * 
 * // Without icon background
 * <RJStatCard 
 *   title="Bookings" 
 *   value="567" 
 *   icon={Calendar}
 *   iconColor="warning"
 *   showIconBg={false}
 * />
 * ```
 */
export const RJCard = React.forwardRef<HTMLDivElement, RJStatCardProps>(
  (
    {
      className,
      padding,
      bordered,
      size,
      title,
      value,
      icon: Icon,
      iconColor = "primary",
      trend,
      trendValue,
      showIconBg = true,
      iconSize = "md",
      description,
      ...props
    },
    ref
  ) => {
    return (
      <div
        ref={ref}
        className={cn(
          statCardVariants({
            padding,
            bordered,
            size,
          }),
          className
        )}
        {...props}
      >
        <div className="flex items-center justify-between">
          {/* Content */}
          <div className="flex-1">
            <p className="text-sm text-gray-500 mb-1">{title}</p>
            <p className="text-2xl font-bold text-gray-900">{value}</p>
            
            {/* Trend indicator */}
            {(trend || trendValue) && trend !== "neutral" && trendValue && (
              <div
                className={cn(
                  "flex items-center mt-2 text-sm",
                  trendColorVariants[trend || "neutral"]
                )}
              >
                {trend === "up" ? (
                  <TrendingUp className={cn("w-4 h-4 mr-1", iconInnerSizes[iconSize])} />
                ) : trend === "down" ? (
                  <TrendingDown className={cn("w-4 h-4 mr-1", iconInnerSizes[iconSize])} />
                ) : (
                  <Minus className={cn("w-4 h-4 mr-1", iconInnerSizes[iconSize])} />
                )}
                <span>{trendValue}</span>
              </div>
            )}

            {/* Description */}
            {description && (
              <p className="text-sm text-gray-500 mt-2">{description}</p>
            )}
          </div>

          {/* Icon */}
          {Icon && (
            <div
              className={cn(
                "flex items-center justify-center rounded-xl",
                showIconBg ? iconColorVariants[iconColor] : `text-${iconColor}-600`,
                showIconBg ? iconSizes[iconSize] : "p-0"
              )}
              style={!showIconBg ? { color: `var(--color-${iconColor}-600)` } as React.CSSProperties : undefined}
            >
              <Icon className={iconInnerSizes[iconSize]} />
            </div>
          )}
        </div>
      </div>
    );
  }
);

// Display name for React DevTools
RJCard.displayName = "RJStatCard";

export const RJStatCard = RJCard;

export default RJStatCard;
