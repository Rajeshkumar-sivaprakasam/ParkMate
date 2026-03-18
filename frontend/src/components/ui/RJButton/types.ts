import { cva, type VariantProps } from "@/lib/utils";

/**
 * RJButton variant configuration
 */
export const buttonVariants = cva(
  // Base styles - inline-flex for horizontal alignment, center for icon/text
  "inline-flex items-center justify-center gap-2 rounded-lg font-medium transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50",
  {
    variants: {
      // Button variants - visual style
      variant: {
        // Primary - filled brand color
        primary:
          "bg-blue-600 text-white hover:bg-blue-700 focus-visible:ring-blue-500 shadow-sm",
        // Secondary - filled neutral
        secondary:
          "bg-gray-900 text-white hover:bg-gray-800 focus-visible:ring-gray-500 shadow-sm",
        // Outline - transparent with border
        outline:
          "border-2 border-gray-300 bg-transparent text-gray-700 hover:bg-gray-50 hover:border-gray-400 focus-visible:ring-gray-500",
        // Ghost - no background
        ghost:
          "bg-transparent text-gray-700 hover:bg-gray-100 focus-visible:ring-gray-500",
        // Danger - red filled
        danger:
          "bg-red-600 text-white hover:bg-red-700 focus-visible:ring-red-500 shadow-sm",
        // Success - green filled
        success:
          "bg-green-600 text-white hover:bg-green-700 focus-visible:ring-green-500 shadow-sm",
        // Warning - amber filled
        warning:
          "bg-amber-500 text-white hover:bg-amber-600 focus-visible:ring-amber-500 shadow-sm",
        // Link - looks like a link
        link: "bg-transparent text-blue-600 hover:text-blue-700 hover:underline p-0",
      },
      // Button sizes
      size: {
        // Small - compact
        sm: "h-8 px-3 text-sm",
        // Medium - default
        md: "h-10 px-4 text-base",
        // Large - prominent
        lg: "h-12 px-6 text-lg",
        // Extra large - call to action
        xl: "h-14 px-8 text-xl",
        // Icon only small
        "icon-sm": "h-8 w-8",
        // Icon only medium (default)
        "icon-md": "h-10 w-10",
        // Icon only large
        "icon-lg": "h-12 w-12",
        // Icon only extra large
        "icon-xl": "h-14 w-14",
      },
      // Full width option
      fullWidth: {
        true: "w-full",
      },
    },
    // Default variant and size
    defaultVariants: {
      variant: "primary",
      size: "md",
    },
  },
);

/**
 * RJButton props interface
 */
export interface RJButtonProps
  extends
    React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  /**
   * Button content
   */
  children: React.ReactNode;
  /**
   * Loading state - shows spinner and disables button
   */
  loading?: boolean;
  /**
   * Left icon component
   */
  leftIcon?: React.ReactNode;
  /**
   * Right icon component
   */
  rightIcon?: React.ReactNode;
}
