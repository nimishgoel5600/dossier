import { cn } from "@/lib/cn";

export type ProgressStepsProps = {
  steps: readonly string[];
  /** Index of the step in progress; `steps.length` once everything is done. */
  current: number;
  className?: string;
};

/**
 * Named steps of a longer job, e.g. "Reading the posting" while the AI works.
 * Screen readers hear each step as it starts through a polite live region.
 */
export function ProgressSteps({ steps, current, className }: ProgressStepsProps) {
  const status =
    current < steps.length ? `${steps[current]}…` : "Done.";
  return (
    <div className={className}>
      <ol className="flex flex-col gap-3.5">
        {steps.map((label, index) => {
          const state = index < current ? "done" : index === current ? "current" : "upcoming";
          return (
            <li
              key={label}
              aria-current={state === "current" ? "step" : undefined}
              className={cn(
                "flex items-center gap-3 text-lead",
                state === "upcoming" ? "text-muted" : "text-ink",
              )}
            >
              <span
                aria-hidden="true"
                className={cn(
                  "grid size-[22px] place-items-center rounded-full border text-xs",
                  state === "done" && "border-primary bg-primary text-on-primary",
                  state === "current" && "border-primary motion-safe:animate-pulse",
                  state === "upcoming" && "border-line-strong",
                )}
              >
                {state === "done" ? "✓" : state === "current" ? "·" : ""}
              </span>
              {label}
              {state === "done" && <span className="sr-only"> (done)</span>}
            </li>
          );
        })}
      </ol>
      <p role="status" className="sr-only">
        {status}
      </p>
    </div>
  );
}
