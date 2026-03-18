import { cva, type VariantProps } from "@/lib/utils";

/**
 * RJStatCard variant configuration
 */
export const statCardVariants = cva(
  // Base styles
  "bg-white rounded-xl p-6 shadow-sm border transition-shadow hover:shadow-md",
  {
    variants: {
      // Card padding
      padding: {
        none: "p-0",
        sm: "p-3",
        md: "p-6",
        lg: "p-8",
      },
      // Card border
      bordered: {
        true: "border border-gray-200",
        false: "border border-gray-100",
      },
      // Card size
      size: {
        sm: "p-4",
        md: "p-6",
        lg: "p-8",
      },
    },
    defaultVariants: {
      padding: "md",
      bordered: false,
    },
  },
);

/**
 * Icon color variants
 */
export const iconColorVariants = {
  primary: "bg-blue-100 text-blue-600",
  secondary: "bg-gray-100 text-gray-600",
  success: "bg-green-100 text-green-600",
  warning: "bg-amber-100 text-amber-600",
  danger: "bg-red-100 text-red-600",
  info: "bg-cyan-100 text-cyan-600",
  purple: "bg-purple-100 text-purple-600",
  pink: "bg-pink-100 text-pink-600",
};

/**
 * Trend color variants
 */
export const trendColorVariants = {
  up: "text-green-600",
  down: "text-red-600",
  neutral: "text-gray-500",
};

/**
 * RJStatCard props interface
 */
export interface RJStatCardProps
  extends
    React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof statCardVariants> {
  /**
   * Card title
   */
  title: string;
  /**
   * Card value
   */
  value: string | number;
  /**
   * Icon component (from lucide-react or similar)
   */
  icon?: React.ElementType;
  /**
   * Icon color variant
   */
  iconColor?: keyof typeof iconColorVariants;
  /**
   * Trend direction
   */
  trend?: "up" | "down" | "neutral";
  /**
   * Trend value text
   */
  trendValue?: string;
  /**
   * Show icon background
   */
  showIconBg?: boolean;
  /**
   * Icon size
   */
  iconSize?: "sm" | "md" | "lg";
  /**
   * Description text below value
   */
  description?: string;
}
