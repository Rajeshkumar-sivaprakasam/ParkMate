import React, { useState } from "react";
import { cn } from "@/lib/utils";
import { avatarVariants, type RJAvatarProps, type RJAvatarGroupProps } from "./types";

/**
 * Status indicator colors
 */
const statusColors = {
  online: "bg-green-500",
  offline: "bg-gray-400",
  busy: "bg-red-500",
  away: "bg-amber-500",
};

/**
 * Status indicator sizes
 */
const statusSizes = {
  sm: "h-2 w-2",
  md: "h-2.5 w-2.5",
  lg: "h-3 w-3",
};

/**
 * Get initials from a name
 */
function getInitials(name: string): string {
  return name
    .split(" ")
    .map((word) => word[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

/**
 * RJAvatar - A fully customizable avatar component
 * 
 * @example
 * ```tsx
 * // Basic usage with image
 * <RJAvatar src="https://example.com/avatar.jpg" alt="John Doe" />
 * 
 * // With fallback initials
 * <RJAvatar fallback="John Doe" />
 * 
 * // With status
 * <RJAvatar src="..." status="online" />
 * 
 * // Different sizes and shapes
 * <RJAvatar src="..." size="xl" shape="square" />
 * ```
 */
export const RJAvatar = React.forwardRef<HTMLDivElement, RJAvatarProps>(
  (
    {
      className,
      size,
      shape,
      border,
      src,
      alt,
      fallback,
      status,
      statusSize = "md",
      ...props
    },
    ref
  ) => {
    const [imageError, setImageError] = useState(false);

    // Determine if we should show the image
    const showImage = src && !imageError;

    // Get initials from fallback or alt
    const initials = fallback || (alt ? getInitials(alt) : "?");

    return (
      <div
        ref={ref}
        className={cn(
          avatarVariants({
            size,
            shape,
            border,
          }),
          className
        )}
        {...props}
      >
        {/* Image */}
        {showImage && (
          <img
            src={src}
            alt={alt}
            className="h-full w-full object-cover"
            onError={() => setImageError(true)}
          />
        )}

        {/* Fallback initials */}
        {!showImage && (
          <span className="font-medium text-gray-600">
            {initials}
          </span>
        )}

        {/* Status indicator */}
        {status && (
          <span
            className={cn(
              "absolute bottom-0 right-0 block rounded-full border-2 border-white",
              statusSizes[statusSize],
              statusColors[status]
            )}
          />
        )}
      </div>
    );
  }
);

// Display name for React DevTools
RJAvatar.displayName = "RJAvatar";

/**
 * RJAvatarGroup - A group of avatars with overlap
 * 
 * @example
 * ```tsx
 * <RJAvatarGroup max={4}>
 *   <RJAvatar src="..." />
 *   <RJAvatar src="..." />
 *   <RJAvatar fallback="John" />
 * </RJAvatarGroup>
 * ```
 */
export const RJAvatarGroup: React.FC<RJAvatarGroupProps> = ({
  className,
  children,
  max = 4,
  size = "md",
  total,
  ...props
}) => {
  // Convert children to array and get their count
  const childArray = React.Children.toArray(children);
  const visibleAvatars = childArray.slice(0, max);
  const remainingCount = total || (childArray.length - max);

  return (
    <div
      className={cn(
        "flex -space-x-3",
        className
      )}
      {...props}
    >
      {/* Visible avatars */}
      {visibleAvatars.map((child, index) => (
        <React.Fragment key={index}>
          {React.isValidElement(child)
            ? React.cloneElement(child as React.ReactElement<RJAvatarProps>, {
                size,
                border: "sm",
              })
            : child}
        </React.Fragment>
      ))}

      {/* Remaining count badge */}
      {remainingCount > 0 && (
        <div
          className={cn(
            avatarVariants({ size, border: "sm" }),
            "bg-gray-100 text-gray-600 font-medium"
          )}
        >
          +{remainingCount}
        </div>
      )}
    </div>
  );
};

RJAvatarGroup.displayName = "RJAvatarGroup";

export default RJAvatar;
