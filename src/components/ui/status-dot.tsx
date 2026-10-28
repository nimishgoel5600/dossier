import type { ApplicationStatus } from "@/generated/prisma/enums";
import { cn } from "@/lib/cn";
import { statusInfo } from "@/lib/status";

/**
 * The 8px dot in an application status's colour. It's decorative: always
 * show the status name next to it.
 */
export function StatusDot({ status, className }: { status: ApplicationStatus; className?: string }) {
  return (
    <span
      aria-hidden="true"
      className={cn("inline-block size-2 shrink-0 rounded-full", className)}
      style={{ backgroundColor: statusInfo(status).color }}
    />
  );
}
