"use client";

import { RadioGroup } from "radix-ui";
import type { ReactNode } from "react";

import { cn } from "@/lib/cn";

export type SegmentedOption<T extends string> = { value: T; label: ReactNode };

export type SegmentedControlProps<T extends string> = Omit<
  RadioGroup.RadioGroupProps,
  "value" | "defaultValue" | "onValueChange" | "children" | "orientation"
> & {
  options: readonly SegmentedOption<T>[];
  value?: T;
  defaultValue?: T;
  onValueChange?: (value: T) => void;
  size?: "md" | "sm";
  /** Name the control with `aria-label` or `aria-labelledby`. */
  "aria-label"?: string;
  "aria-labelledby"?: string;
};

/**
 * Picks one of a few options, e.g. Board / Table or Faithful / Balanced /
 * Expressive. It follows the WAI-ARIA radio group pattern: Tab focuses the
 * selected option and the arrow keys move and select.
 */
export function SegmentedControl<T extends string>({
  options,
  onValueChange,
  size = "md",
  className,
  ...props
}: SegmentedControlProps<T>) {
  return (
    <RadioGroup.Root
      orientation="horizontal"
      onValueChange={onValueChange as ((value: string) => void) | undefined}
      className={cn(
        "inline-flex w-fit bg-track p-[3px]",
        size === "md" ? "rounded-[10px]" : "rounded-[9px]",
        className,
      )}
      {...props}
    >
      {options.map((option) => (
        <RadioGroup.Item
          key={option.value}
          value={option.value}
          className={cn(
            "text-ink disabled:cursor-not-allowed disabled:text-muted data-[state=checked]:bg-card data-[state=checked]:shadow-raised",
            size === "md"
              ? "rounded-control px-3.5 py-[7px] text-control font-medium"
              : "rounded-[7px] px-3 py-1.5 text-meta",
          )}
        >
          {option.label}
        </RadioGroup.Item>
      ))}
    </RadioGroup.Root>
  );
}
