import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { verifySession } from "@/lib/auth/session";
import { findLatestJob } from "@/lib/jobs/runner";

import { JobDemo } from "./job-demo";

export const metadata: Metadata = { title: "Jobs", robots: { index: false } };

/** Tries the background job runner (E6-7) with a demo job. Development only. */
export default async function DevJobsPage() {
  if (process.env.NODE_ENV === "production") notFound();
  await verifySession();
  // After a reload, pick up the latest demo job where it is.
  const latest = await findLatestJob("dev-demo");
  return <JobDemo initialId={latest?.id ?? null} />;
}
