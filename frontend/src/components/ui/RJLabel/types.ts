import { cva, type VariantProps } from "@/lib/utils";

/**
 * RJLabel variant configuration
 */
export const labelVariants = cva(
  // Base styles
  "text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70",
  {
    variants: {
      // Label size
      size: {
        sm: "text-xs",
        md: "text-sm",
        lg: "text-base",
      },
      // Label color variants
      variant: {
        default: "text-gray-700",
        error: "text-red-600",
        success: "text-green-600",
        muted: "text-gray-500",
        white: "text-white",
      },
    },
    defaultVariants: {
      size: "md",
      variant: "default",
    },
  },
);

/**
 * RJLabel props interface
 */
export interface RJLabelProps
  extends
    React.LabelHTMLAttributes<HTMLLabelElement>,
    VariantProps<typeof labelVariants> {
  /**
   * Whether the label is required
   */
  required?: boolean;
  /**
   * Whether the label is disabled
   */
  disabled?: boolean;
}
