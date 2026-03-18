import { cva, type VariantProps } from "@/lib/utils";

/**
 * RJModal variant configuration
 */
export const modalVariants = cva(
  // Base styles
  "relative w-full bg-white rounded-2xl shadow-xl transition-all",
  {
    variants: {
      // Modal size
      size: {
        sm: "max-w-md",
        md: "max-w-lg",
        lg: "max-w-2xl",
        xl: "max-w-4xl",
        full: "max-w-[90vw]",
      },
      // Modal padding
      padding: {
        none: "",
        sm: "p-4",
        md: "p-6",
        lg: "p-8",
      },
    },
    defaultVariants: {
      size: "md",
      padding: "md",
    },
  },
);

/**
 * Overlay variants
 */
export const overlayVariants = cva(
  // Base styles
  "fixed inset-0 z-50 bg-black/50 backdrop-blur-sm transition-opacity",
  {
    variants: {
      // Fade animation
      fade: {
        true: "animate-in fade-in-0",
        false: "",
      },
    },
    defaultVariants: {
      fade: true,
    },
  },
);

/**
 * RJModal props interface
 */
export interface RJModalProps {
  /**
   * Whether the modal is open
   */
  open: boolean;
  /**
   * Callback when modal should close
   */
  onClose: () => void;
  /**
   * Modal title
   */
  title?: React.ReactNode;
  /**
   * Modal description
   */
  description?: React.ReactNode;
  /**
   * Modal size
   */
  size?: "sm" | "md" | "lg" | "xl" | "full";
  /**
   * Modal padding
   */
  padding?: "none" | "sm" | "md" | "lg";
  /**
   * Show close button
   */
  showClose?: boolean;
  /**
   * Close on overlay click
   */
  closeOnOverlay?: boolean;
  /**
   * Close on escape key
   */
  closeOnEscape?: boolean;
  /**
   * Modal children
   */
  children: React.ReactNode;
  /**
   * Footer content
   */
  footer?: React.ReactNode;
  /**
   * Additional className
   */
  className?: string;
  /**
   * Disable portal
   */
  disablePortal?: boolean;
}

/**
 * RJModalHeader props
 */
export interface RJModalHeaderProps {
  /**
   * Title
   */
  title: React.ReactNode;
  /**
   * Description
   */
  description?: React.ReactNode;
  /**
   * Show close button
   */
  showClose?: boolean;
  /**
   * Close callback
   */
  onClose?: () => void;
  /**
   * Additional className
   */
  className?: string;
}

/**
 * RJModalFooter props
 */
export interface RJModalFooterProps {
  /**
   * Footer content
   */
  children: React.ReactNode;
  /**
   * Justify content
   */
  justify?: "start" | "center" | "end" | "between" | "around";
  /**
   * Gap between items
   */
  gap?: "sm" | "md" | "lg";
  /**
   * Additional className
   */
  className?: string;
}

/**
 * RJModalBody props
 */
export interface RJModalBodyProps {
  /**
   * Body content
   */
  children: React.ReactNode;
  /**
   * Additional className
   */
  className?: string;
}
