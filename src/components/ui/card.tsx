import type { ComponentProps } from "react";

import { cn } from "@/lib/cn";

export type CardProps = ComponentProps<"div"> & {
  /** `default` is the prototype's 28px; `none` leaves spacing to the content. */
  padding?: "default" | "none";
};

/** A light panel with a hairline border, used to group a form or a section. */
export function Card({ padding = "default", className, ...props }: CardProps) {
  return (
    <div
      className={cn(
        "rounded-panel border border-line-card bg-card",
        padding === "default" && "p-7",
        className,
      )}
      {...props}
    />
  );
}
