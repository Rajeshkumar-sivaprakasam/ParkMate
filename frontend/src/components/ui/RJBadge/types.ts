import { cva, type VariantProps } from "@/lib/utils";

/**
 * RJBadge variant configuration
 */
export const badgeVariants = cva(
  // Base styles
  "inline-flex items-center justify-center rounded-full font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2",
  {
    variants: {
      // Badge size
      size: {
        sm: "h-5 px-2 text-xs",
        md: "h-6 px-2.5 text-sm",
        lg: "h-7 px-3 text-sm",
      },
      // Badge color variants
      variant: {
        // Primary - blue
        primary: "bg-blue-100 text-blue-800",
        // Secondary - gray
        secondary: "bg-gray-100 text-gray-800",
        // Success - green
        success: "bg-green-100 text-green-800",
        // Warning - amber
        warning: "bg-amber-100 text-amber-800",
        // Danger - red
        danger: "bg-red-100 text-red-800",
        // Info - cyan
        info: "bg-cyan-100 text-cyan-800",
        // Purple
        purple: "bg-purple-100 text-purple-800",
        // Pink
        pink: "bg-pink-100 text-pink-800",
        // Outline variants
        "outline-primary": "border border-blue-300 text-blue-700",
        "outline-secondary": "border border-gray-300 text-gray-700",
        "outline-success": "border border-green-300 text-green-700",
        "outline-warning": "border border-amber-300 text-amber-700",
        "outline-danger": "border border-red-300 text-red-700",
        // Soft variants
        "soft-primary": "bg-blue-50 text-blue-600",
        "soft-secondary": "bg-gray-50 text-gray-600",
        "soft-success": "bg-green-50 text-green-600",
        "soft-warning": "bg-amber-50 text-amber-600",
        "soft-danger": "bg-red-50 text-red-600",
      },
    },
    defaultVariants: {
      size: "md",
      variant: "secondary",
    },
  },
);

/**
 * RJBadge props interface
 */
export interface RJBadgeProps
  extends
    React.HTMLAttributes<HTMLSpanElement>,
    VariantProps<typeof badgeVariants> {
  /**
   * Badge content
   */
  children: React.ReactNode;
  /**
   * Whether the badge should be a dot only
   */
  dot?: boolean;
  /**
   * Dot color (when dot is true)
   */
  dotColor?: "default" | "success" | "warning" | "danger" | "info";
}
