import { cva, type VariantProps } from "@/lib/utils";

/**
 * RJSpinner variant configuration
 */
export const spinnerVariants = cva(
  // Base styles
  "animate-spin text-current",
  {
    variants: {
      // Spinner sizes
      size: {
        xs: "h-3 w-3",
        sm: "h-4 w-4",
        md: "h-5 w-5",
        lg: "h-6 w-6",
        xl: "h-8 w-8",
      },
      // Spinner color variants
      variant: {
        primary: "text-blue-600",
        secondary: "text-gray-600",
        white: "text-white",
        inherit: "text-inherit",
      },
    },
    defaultVariants: {
      size: "md",
      variant: "inherit",
    },
  },
);

/**
 * RJSpinner props interface
 */
export interface RJSpinnerProps
  extends
    React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof spinnerVariants> {
  /**
   * Custom SVG path or use default
   */
  path?: React.ReactNode;
}
