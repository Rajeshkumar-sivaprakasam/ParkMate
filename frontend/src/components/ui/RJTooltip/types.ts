import { cva, type VariantProps } from "@/lib/utils";

/**
 * RJTooltip variant configuration
 */
export const tooltipVariants = cva(
  // Base styles
  "z-50 px-3 py-1.5 text-sm font-medium rounded-lg shadow-lg backdrop-blur-sm transition-all duration-200",
  {
    variants: {
      // Tooltip color variants
      variant: {
        default: "bg-gray-900 text-white",
        primary: "bg-blue-600 text-white",
        secondary: "bg-gray-700 text-white",
        success: "bg-green-600 text-white",
        warning: "bg-amber-600 text-white",
        danger: "bg-red-600 text-white",
        info: "bg-cyan-600 text-white",
        // Light variants
        "light-default": "bg-white text-gray-900 border border-gray-200",
        "light-primary": "bg-blue-50 text-blue-900 border border-blue-200",
        "light-success": "bg-green-50 text-green-900 border border-green-200",
        "light-warning": "bg-amber-50 text-amber-900 border border-amber-200",
        "light-danger": "bg-red-50 text-red-900 border border-red-200",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  },
);

/**
 * Tooltip position styles
 */
export const tooltipPositions = {
  top: "bottom-full left-1/2 -translate-x-1/2 mb-2",
  bottom: "top-full left-1/2 -translate-x-1/2 mt-2",
  left: "right-full top-1/2 -translate-y-1/2 mr-2",
  right: "left-full top-1/2 -translate-y-1/2 ml-2",
  "top-start": "bottom-full left-0 mb-2",
  "top-end": "bottom-full right-0 mb-2",
  "bottom-start": "top-full left-0 mt-2",
  "bottom-end": "top-full right-0 mt-2",
  "left-start": "right-full top-0 mr-2",
  "left-end": "right-full bottom-0 mr-2",
  "right-start": "left-full top-0 ml-2",
  "right-end": "left-full bottom-0 ml-2",
};

/**
 * Arrow position styles
 */
export const arrowPositions = {
  top: "top-full left-1/2 -translate-x-1/2 border-t-[6px]",
  bottom: "bottom-full left-1/2 -translate-x-1/2 border-b-[6px]",
  left: "left-full top-1/2 -translate-y-1/2 border-l-[6px]",
  right: "right-full top-1/2 -translate-y-1/2 border-r-[6px]",
  "top-start": "top-full left-2 border-t-[6px]",
  "top-end": "top-full right-2 border-t-[6px]",
  "bottom-start": "bottom-full left-2 border-b-[6px]",
  "bottom-end": "bottom-full right-2 border-b-[6px]",
  "left-start": "left-full top-2 border-l-[6px]",
  "left-end": "left-full bottom-2 border-l-[6px]",
  "right-start": "right-full top-2 border-r-[6px]",
  "right-end": "right-full bottom-2 border-r-[6px]",
};

/**
 * Arrow color variants
 */
export const arrowColorVariants = {
  default: "border-t-gray-900",
  primary: "border-t-blue-600",
  secondary: "border-t-gray-700",
  success: "border-t-green-600",
  warning: "border-t-amber-600",
  danger: "border-t-red-600",
  info: "border-t-cyan-600",
  "light-default": "border-t-white",
  "light-primary": "border-t-blue-50",
  "light-success": "border-t-green-50",
  "light-warning": "border-t-amber-50",
  "light-danger": "border-t-red-50",
};

/**
 * RJTooltip props interface
 */
export interface RJTooltipProps {
  /**
   * Tooltip content
   */
  content: React.ReactNode;
  /**
   * Tooltip position
   */
  position?: keyof typeof tooltipPositions;
  /**
   * Tooltip variant
   */
  variant?: VariantProps<typeof tooltipVariants>["variant"];
  /**
   * Show arrow
   */
  showArrow?: boolean;
  /**
   * Delay in milliseconds before showing
   */
  delay?: number;
  /**
   * Disable the tooltip
   */
  disabled?: boolean;
  /**
   * Tooltip children (trigger element)
   */
  children: React.ReactNode;
}
