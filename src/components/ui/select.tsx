import type { ComponentProps } from "react";

import { cn } from "@/lib/cn";

import { controlClassName, FieldShell, useField, type FieldProps } from "./field";

export type SelectProps = ComponentProps<"select"> &
  FieldProps & {
    /** Classes for the wrapper around label, select and messages. */
    className?: string;
    selectClassName?: string;
  };

/**
 * A native select (as in the prototype) with an optional label, hint and
 * error. Pass `<option>` elements as children.
 */
export function Select({
  label,
  hint,
  error,
  id,
  className,
  selectClassName,
  ...props
}: SelectProps) {
  const field = useField({ id, hint, error });
  return (
    <FieldShell {...field} label={label} hint={hint} error={error} className={className}>
      <select
        {...field.controlProps}
        className={cn(controlClassName, "cursor-pointer px-2.5 py-2.5", selectClassName)}
        {...props}
      />
    </FieldShell>
  );
}
