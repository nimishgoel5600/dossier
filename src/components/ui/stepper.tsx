import { cn } from "@/lib/cn";

export type StepperProps = {
  steps: readonly string[];
  /** Index of the current step; earlier steps show as done. */
  current: number;
  "aria-label"?: string;
  className?: string;
};

/** Where the user is in a multi-step flow, e.g. the new application flow. */
export function Stepper({
  steps,
  current,
  "aria-label": ariaLabel = "Progress",
  className,
}: StepperProps) {
  return (
    <ol aria-label={ariaLabel} className={cn("flex flex-wrap gap-x-7 gap-y-2.5", className)}>
      {steps.map((label, index) => {
        const state = index < current ? "done" : index === current ? "current" : "upcoming";
        return (
          <li
            key={label}
            aria-current={state === "current" ? "step" : undefined}
            className={cn(
              "flex items-center gap-[9px] text-control",
              state === "upcoming" ? "text-muted" : "text-ink",
            )}
          >
            <span
              aria-hidden="true"
              className={cn(
                "grid size-[22px] place-items-center rounded-full border text-[11.5px] font-semibold",
                state === "done" && "border-primary bg-primary text-on-primary",
                state === "current" && "border-primary text-ink",
                state === "upcoming" && "border-line-strong text-muted",
              )}
            >
              {state === "done" ? "✓" : index + 1}
            </span>
            {label}
            {state === "done" && <span className="sr-only"> (done)</span>}
          </li>
        );
      })}
    </ol>
  );
}
