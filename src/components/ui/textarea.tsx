import type { ComponentProps } from "react";

import { cn } from "@/lib/cn";

import { controlClassName, FieldShell, useField, type FieldProps } from "./field";

export type TextareaProps = ComponentProps<"textarea"> &
  FieldProps & {
    /** Classes for the wrapper around label, textarea and messages. */
    className?: string;
    textareaClassName?: string;
  };

/** A multi-line text input with an optional label, hint and error. */
export function Textarea({
  label,
  hint,
  error,
  id,
  className,
  textareaClassName,
  ...props
}: TextareaProps) {
  const field = useField({ id, hint, error });
  return (
    <FieldShell {...field} label={label} hint={hint} error={error} className={className}>
      <textarea
        {...field.controlProps}
        className={cn(controlClassName, "resize-y px-3 py-[11px] leading-[1.6]", textareaClassName)}
        {...props}
      />
    </FieldShell>
  );
}
