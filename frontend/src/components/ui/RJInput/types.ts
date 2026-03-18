import { cva, type VariantProps } from "@/lib/utils";

/**
 * RJInput variant configuration
 */
export const inputVariants = cva(
  // Base styles
  "flex w-full rounded-lg border bg-white px-3 py-2 text-sm placeholder:text-gray-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-1 disabled:cursor-not-allowed disabled:opacity-50 transition-colors duration-200",
  {
    variants: {
      // Input size variants
      size: {
        sm: "h-8 text-xs px-2.5 py-1.5",
        md: "h-10 text-sm px-3 py-2",
        lg: "h-12 text-base px-4 py-3",
      },
      // Input visual variants
      variant: {
        // Default gray border
        default: "border-gray-300 focus:border-blue-500 focus:ring-blue-500/20",
        // Error state - red border
        error:
          "border-red-500 focus:border-red-500 focus:ring-red-500/20 text-red-900 placeholder:text-red-300",
        // Success state - green border
        success:
          "border-green-500 focus:border-green-500 focus:ring-green-500/20",
        // Minimal - light border
        minimal:
          "border-gray-200 bg-gray-50 focus:border-blue-500 focus:ring-blue-500/20",
        // Filled - dark background
        filled:
          "border-transparent bg-gray-100 focus:bg-gray-200 focus:border-gray-400",
      },
    },
    defaultVariants: {
      size: "md",
      variant: "default",
    },
  },
);

/**
 * RJInput props interface
 */
export interface RJInputProps
  extends
    Omit<React.InputHTMLAttributes<HTMLInputElement>, "size">,
    VariantProps<typeof inputVariants> {
  /**
   * Input label
   */
  label?: string;
  /**
   * Helper text displayed below input
   */
  helperText?: string;
  /**
   * Error message (will show error variant)
   */
  error?: string;
  /**
   * Success message
   */
  success?: string;
  /**
   * Left addon (icon or text)
   */
  leftAddon?: React.ReactNode;
  /**
   * Right addon (icon or text)
   */
  rightAddon?: React.ReactNode;
  /**
   * Full width option
   */
  fullWidth?: boolean;
}

/**
 * RJTextArea props interface
 */
export interface RJTextAreaProps
  extends
    React.TextareaHTMLAttributes<HTMLTextAreaElement>,
    VariantProps<typeof inputVariants> {
  /**
   * Textarea label
   */
  label?: string;
  /**
   * Helper text displayed below textarea
   */
  helperText?: string;
  /**
   * Error message
   */
  error?: string;
  /**
   * Full width option
   */
  fullWidth?: boolean;
}
