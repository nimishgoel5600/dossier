"use server";

import { z } from "zod";

import { action } from "@/lib/action";
import { startJob } from "@/lib/jobs/runner";

import { demoJob } from "./demo-job";

/** Starts the demo job (development only). */
export const startDemoJob = action(z.object({ fail: z.boolean() }), async ({ fail }) => {
  if (process.env.NODE_ENV === "production") return null;
  return startJob(demoJob, { fail, stepMs: 1500 }, { key: "dev-demo" });
});
