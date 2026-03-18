import { cva, type VariantProps } from "@/lib/utils";

/**
 * RJAvatar variant configuration
 */
export const avatarVariants = cva(
  // Base styles
  "relative inline-flex items-center justify-center overflow-hidden rounded-full bg-gray-100 flex-shrink-0",
  {
    variants: {
      // Avatar size
      size: {
        xs: "h-6 w-6 text-xs",
        sm: "h-8 w-8 text-sm",
        md: "h-10 w-10 text-base",
        lg: "h-12 w-12 text-lg",
        xl: "h-16 w-16 text-xl",
        "2xl": "h-20 w-20 text-2xl",
      },
      // Avatar shape
      shape: {
        circle: "rounded-full",
        square: "rounded-lg",
        rounded: "rounded-xl",
      },
      // Avatar border
      border: {
        none: "",
        sm: "border-2 border-white",
        md: "border-4 border-white",
      },
    },
    defaultVariants: {
      size: "md",
      shape: "circle",
      border: "none",
    },
  },
);

/**
 * RJAvatar props interface
 */
export interface RJAvatarProps
  extends
    React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof avatarVariants> {
  /**
   * Avatar image URL
   */
  src?: string;
  /**
   * Avatar alt text (for accessibility)
   */
  alt?: string;
  /**
   * Fallback text or initials
   */
  fallback?: string;
  /**
   * Status indicator
   */
  status?: "online" | "offline" | "busy" | "away";
  /**
   * Size of the status indicator
   */
  statusSize?: "sm" | "md" | "lg";
}

/**
 * RJAvatarGroup props interface
 */
export interface RJAvatarGroupProps extends React.HTMLAttributes<HTMLDivElement> {
  /**
   * Array of avatar props
   */
  children: React.ReactNode;
  /**
   * Maximum number of avatars to show
   */
  max?: number;
  /**
   * Size of avatars in the group
   */
  size?: "xs" | "sm" | "md" | "lg" | "xl" | "2xl";
  /**
   * Total count to show when max is exceeded
   */
  total?: number;
}
