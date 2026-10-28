import "server-only";

import { z } from "zod";

import { defineJob } from "@/lib/jobs/runner";

const pause = (ms: number, signal: AbortSignal) =>
  new Promise<void>((resolve, reject) => {
    const timer = setTimeout(resolve, ms);
    signal.addEventListener("abort", () => {
      clearTimeout(timer);
      reject(signal.reason);
    });
  });

/** A job with named steps and no AI, for trying the runner on /dev/jobs. */
export const demoJob = defineJob({
  type: "dev-demo",
  input: z.object({ fail: z.boolean(), stepMs: z.number().int().min(0).max(10_000) }),
  result: z.object({ finishedAt: z.string() }),
  async run({ fail, stepMs }, { step, signal }) {
    for (const name of ["Reading the posting", "Checking it against your profile", "Writing your documents"]) {
      await step(name);
      await pause(stepMs, signal);
    }
    if (fail) throw new Error("The demo job failed on purpose.");
    return { finishedAt: new Date().toISOString() };
  },
});
