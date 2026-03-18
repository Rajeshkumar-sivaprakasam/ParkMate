import React, { useEffect, useCallback } from "react";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  modalVariants,
  type RJModalProps,
  type RJModalHeaderProps,
  type RJModalFooterProps,
  type RJModalBodyProps,
} from "./types";

/**
 * Justify content mapping
 */
const justifyMap = {
  start: "justify-start",
  center: "justify-center",
  end: "justify-end",
  between: "justify-between",
  around: "justify-around",
};

/**
 * Gap mapping
 */
const gapMap = {
  sm: "gap-2",
  md: "gap-3",
  lg: "gap-4",
};

/**
 * RJModalHeader - Modal header component
 */
export const RJModalHeader: React.FC<RJModalHeaderProps> = ({
  title,
  description,
  showClose = true,
  onClose,
  className,
}) => {
  return (
    <div className={cn("flex items-start justify-between mb-4", className)}>
      <div>
        {typeof title === "string" ? (
          <h2 className="text-xl font-semibold text-gray-900">{title}</h2>
        ) : (
          title
        )}
        {description && (
          <p className="mt-1 text-sm text-gray-500">{description}</p>
        )}
      </div>
      {showClose && onClose && (
        <button
          onClick={onClose}
          className="p-1 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors"
          aria-label="Close modal"
        >
          <X className="w-5 h-5" />
        </button>
      )}
    </div>
  );
};

/**
 * RJModalBody - Modal body component
 */
export const RJModalBody: React.FC<RJModalBodyProps> = ({
  children,
  className,
}) => {
  return <div className={cn("", className)}>{children}</div>;
};

/**
 * RJModalFooter - Modal footer component
 */
export const RJModalFooter: React.FC<RJModalFooterProps> = ({
  children,
  justify = "end",
  gap = "md",
  className,
}) => {
  return (
    <div
      className={cn(
        "flex mt-6",
        justifyMap[justify],
        gapMap[gap],
        className
      )}
    >
      {children}
    </div>
  );
};

/**
 * RJModal - A fully customizable modal component
 * 
 * @example
 * ```tsx
 * // Basic usage
 * <RJModal open={isOpen} onClose={() => setIsOpen(false)}>
 *   <RJModalHeader title="Modal Title" description="Description" />
 *   <RJModalBody>
 *     <p>Modal content goes here</p>
 *   </RJModalBody>
 *   <RJModalFooter>
 *     <RJButton variant="outline" onClick={() => setIsOpen(false)}>Cancel</RJButton>
 *     <RJButton onClick={handleConfirm}>Confirm</RJButton>
 *   </RJModalFooter>
 * </RJModal>
 * ```
 */
export const RJModal: React.FC<RJModalProps> = ({
  open,
  onClose,
  title,
  description,
  size = "md",
  padding = "md",
  showClose = true,
  closeOnOverlay = true,
  closeOnEscape = true,
  children,
  footer,
  className,
  disablePortal = false,
}) => {
  // Handle escape key
  const handleEscape = useCallback(
    (event: KeyboardEvent) => {
      if (closeOnEscape && event.key === "Escape") {
        onClose();
      }
    },
    [closeOnEscape, onClose]
  );

  // Add escape key listener
  useEffect(() => {
    if (open) {
      document.addEventListener("keydown", handleEscape);
      // Prevent body scroll when modal is open
      document.body.style.overflow = "hidden";
    }

    return () => {
      document.removeEventListener("keydown", handleEscape);
      document.body.style.overflow = "unset";
    };
  }, [open, handleEscape]);

  // Handle overlay click
  const handleOverlayClick = () => {
    if (closeOnOverlay) {
      onClose();
    }
  };

  // Stop propagation on modal click
  const handleModalClick = (e: React.MouseEvent) => {
    e.stopPropagation();
  };

  if (!open) return null;

  // Content
  const modalContent = (
    <>
      {/* Overlay */}
      <div
        className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm animate-in fade-in-0"
        onClick={handleOverlayClick}
        aria-hidden="true"
      />

      {/* Modal container */}
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div
          className={cn(
            modalVariants({
              size,
              padding,
            }),
            "animate-in zoom-in-95 fade-in-0 slide-in-from-bottom-4",
            className
          )}
          onClick={handleModalClick}
          role="dialog"
          aria-modal="true"
          aria-labelledby={title ? "modal-title" : undefined}
        >
          {/* Header */}
          {(title || showClose) && (
            <RJModalHeader
              title={title}
              description={description}
              showClose={showClose}
              onClose={onClose}
            />
          )}

          {/* Body */}
          {children}

          {/* Footer */}
          {footer && <RJModalFooter>{footer}</RJModalFooter>}
        </div>
      </div>
    </>
  );

  // Return as portal or inline
  return disablePortal ? modalContent : modalContent;
};

// Display name for React DevTools
RJModal.displayName = "RJModal";

export default RJModal;
