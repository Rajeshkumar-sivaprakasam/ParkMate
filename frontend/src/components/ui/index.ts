/**
 * RJ UI - Production-Grade React Component Library
 *
 * A reusable, scalable, and fully typed UI component library
 * built with React, TypeScript, and Tailwind CSS.
 *
 * @example
 * ```tsx
 * import { RJButton, RJInput, RJModal } from '@/components/ui';
 *
 * function App() {
 *   return (
 *     <RJButton variant="primary" size="md">
 *       Click Me
 *     </RJButton>
 *   );
 * }
 * ```
 */

// Button Component
export { RJButton, default as RJButtonDefault } from "./RJButton";
export type { RJButtonProps } from "./RJButton";
export { buttonVariants } from "./RJButton";

// Input Components
export { RJInput, RJTextArea, default as RJInputDefault } from "./RJInput";
export type { RJInputProps, RJTextAreaProps } from "./RJInput";
export { inputVariants } from "./RJInput";

// Label Component
export { RJLabel, default as RJLabelDefault } from "./RJLabel";
export type { RJLabelProps } from "./RJLabel";
export { labelVariants } from "./RJLabel";

// Badge Component
export { RJBadge, default as RJBadgeDefault } from "./RJBadge";
export type { RJBadgeProps } from "./RJBadge";
export { badgeVariants } from "./RJBadge";

// Avatar Components
export {
  RJAvatar,
  RJAvatarGroup,
  default as RJAvatarDefault,
} from "./RJAvatar";
export type { RJAvatarProps, RJAvatarGroupProps } from "./RJAvatar";
export { avatarVariants } from "./RJAvatar";

// Spinner Component
export { RJSpinner, default as RJSpinnerDefault } from "./RJSpinner";
export type { RJSpinnerProps } from "./RJSpinner";
export { spinnerVariants } from "./RJSpinner";

// StatCard Component
export { RJStatCard, default as RJStatCardDefault } from "./RJStatCard";
export type { RJStatCardProps } from "./RJStatCard";
export {
  statCardVariants,
  iconColorVariants,
  trendColorVariants,
} from "./RJStatCard";

// Tooltip Component
export { RJTooltip, default as RJTooltipDefault } from "./RJTooltip";
export type { RJTooltipProps } from "./RJTooltip";
export { tooltipVariants, tooltipPositions } from "./RJTooltip";

// Modal Components
export {
  RJModal,
  RJModalHeader,
  RJModalBody,
  RJModalFooter,
  default as RJModalDefault,
} from "./RJModal";
export type {
  RJModalProps,
  RJModalHeaderProps,
  RJModalFooterProps,
  RJModalBodyProps,
} from "./RJModal";
export { modalVariants } from "./RJModal";

// Table Component
export { RJTable, default as RJTableDefault } from "./RJTable";
export type {
  RJTableProps,
  RJTableColumn,
  RJTableHeaderProps,
  RJTableRowProps,
} from "./RJTable";
export { tableVariants } from "./RJTable";
