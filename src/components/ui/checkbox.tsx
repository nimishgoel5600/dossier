import type { ComponentProps, ReactNode } from "react";

import { cn } from "@/lib/cn";

import { useField } from "./field";

export type CheckboxProps = Omit<ComponentProps<"input">, "type"> & {
  label: ReactNode;
  hint?: ReactNode;
  error?: ReactNode;
};

/** A native checkbox with its label beside it and optional hint and error below. */
export function Checkbox({ label, hint, error, id, className, ...props }: CheckboxProps) {
  const field = useField({ id, hint, error });
  return (
    <div className={cn("flex flex-col gap-1.5", className)}>
      <label
        htmlFor={field.controlId}
        className="flex w-fit cursor-pointer items-center gap-2.5 text-sm has-disabled:cursor-not-allowed has-disabled:text-muted"
      >
        <input
          type="checkbox"
          {...field.controlProps}
          className="m-0 size-4 shrink-0 cursor-[inherit] accent-primary"
          {...props}
        />
        {label}
      </label>
      {hint && (
        <p id={field.hintId} className="pl-[26px] text-label text-muted">
          {hint}
        </p>
      )}
      {error && (
        <p id={field.errorId} role="alert" className="pl-[26px] text-label text-error">
          {error}
        </p>
      )}
    </div>
  );
}
