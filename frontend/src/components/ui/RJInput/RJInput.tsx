import React, { useId } from "react";
import { cn } from "@/lib/utils";
import { RJLabel } from "../RJLabel";
import { inputVariants, type RJInputProps, type RJTextAreaProps } from "./types";

/**
 * RJInput - A fully customizable input component
 * 
 * @example
 * ```tsx
 * // Basic usage
 * <RJInput placeholder="Enter your name" />
 * 
 * // With label
 * <RJInput label="Email" type="email" placeholder="Enter your email" />
 * 
 * // With error
 * <RJInput label="Password" type="password" error="Password is required" />
 * 
 * // With addons
 * <RJInput leftAddon={<Icon />} rightAddon=".com" />
 * ```
 */
export const RJInput = React.forwardRef<HTMLInputElement, RJInputProps>(
  (
    {
      className,
      size,
      variant,
      label,
      helperText,
      error,
      success,
      leftAddon,
      rightAddon,
      fullWidth = true,
      id: providedId,
      disabled,
      required,
      ...props
    },
    ref
  ) => {
    // Generate unique ID
    const generatedId = useId();
    const id = providedId || generatedId;

    // Determine variant based on error or success state
    const resolvedVariant = error
      ? "error"
      : success
      ? "success"
      : variant;

    // Determine if there's feedback (error or success)
    const hasFeedback = error || success;

    // Build feedback message
    const feedbackText = error || success;

    return (
      <div className={cn("flex flex-col gap-1.5", fullWidth && "w-full")}>
        {/* Label */}
        {label && (
          <RJLabel
            htmlFor={id}
            required={required}
            disabled={disabled}
          >
            {label}
          </RJLabel>
        )}

        {/* Input wrapper */}
        <div className="relative flex items-center">
          {/* Left addon */}
          {leftAddon && (
            <span className="absolute left-3 flex items-center text-gray-500">
              {leftAddon}
            </span>
          )}

          {/* Input */}
          <input
            ref={ref}
            id={id}
            disabled={disabled}
            required={required}
            className={cn(
              inputVariants({
                size: leftAddon || rightAddon ? "md" : size,
                variant: resolvedVariant,
              }),
              // Add padding for addons
              leftAddon && "pl-10",
              rightAddon && "pr-10",
              // Full width
              fullWidth && "w-full",
              className
            )}
            aria-invalid={!!error}
            aria-describedby={
              hasFeedback ? `${id}-feedback` : helperText ? `${id}-helper` : undefined
            }
            {...props}
          />

          {/* Right addon */}
          {rightAddon && (
            <span className="absolute right-3 flex items-center text-gray-500">
              {rightAddon}
            </span>
          )}
        </div>

        {/* Helper text or feedback */}
        {(helperText || feedbackText) && (
          <span
            id={hasFeedback ? `${id}-feedback` : helperText ? `${id}-helper` : undefined}
            className={cn(
              "text-xs",
              error ? "text-red-600" : success ? "text-green-600" : "text-gray-500"
            )}
          >
            {feedbackText || helperText}
          </span>
        )}
      </div>
    );
  }
);

// Display name for React DevTools
RJInput.displayName = "RJInput";

/**
 * RJTextArea - A fully customizable textarea component
 * 
 * @example
 * ```tsx
 * // Basic usage
 * <RJTextArea placeholder="Enter description" />
 * 
 * // With label and error
 * <RJTextArea label="Message" error="Message is required" rows={4} />
 * ```
 */
export const RJTextArea = React.forwardRef<HTMLTextAreaElement, RJTextAreaProps>(
  (
    {
      className,
      size,
      variant,
      label,
      helperText,
      error,
      fullWidth = true,
      id: providedId,
      disabled,
      required,
      ...props
    },
    ref
  ) => {
    // Generate unique ID
    const generatedId = useId();
    const id = providedId || generatedId;

    // Determine variant based on error state
    const resolvedVariant = error ? "error" : variant;

    return (
      <div className={cn("flex flex-col gap-1.5", fullWidth && "w-full")}>
        {/* Label */}
        {label && (
          <RJLabel
            htmlFor={id}
            required={required}
            disabled={disabled}
          >
            {label}
          </RJLabel>
        )}

        {/* Textarea */}
        <textarea
          ref={ref}
          id={id}
          disabled={disabled}
          required={required}
          className={cn(
            inputVariants({
              size,
              variant: resolvedVariant,
            }),
            "min-h-[80px] resize-y",
            fullWidth && "w-full",
            className
          )}
          aria-invalid={!!error}
          aria-describedby={
            error ? `${id}-feedback` : helperText ? `${id}-helper` : undefined
          }
          {...props}
        />

        {/* Helper text or error */}
        {(helperText || error) && (
          <span
            id={error ? `${id}-feedback` : helperText ? `${id}-helper` : undefined}
            className={cn(
              "text-xs",
              error ? "text-red-600" : "text-gray-500"
            )}
          >
            {error || helperText}
          </span>
        )}
      </div>
    );
  }
);

// Display name for React DevTools
RJTextArea.displayName = "RJTextArea";

export default RJInput;
