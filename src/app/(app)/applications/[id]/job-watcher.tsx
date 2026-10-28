"use client";

import { useJob } from "@/hooks/use-job";
import type { JobView } from "@/lib/jobs/runner";

/**
 * Follows one background job and reports each update; draws nothing. One per
 * job, so a page can follow as many as are running.
 */
export function JobWatcher<R>({
  id,
  revision,
  onChange,
}: {
  id: string;
  /** Bump after a Retry to follow the job's new run. */
  revision: number;
  onChange: (job: JobView<R>) => void;
}) {
  useJob<R>(id, revision, onChange);
  return null;
}
