import { NextResponse } from "next/server";

import { getJob, isFinished, subscribeJob, type JobView } from "@/lib/jobs/runner";
import { route } from "@/lib/route";

/** Keeps proxies from closing a quiet stream while a local model thinks. */
const HEARTBEAT_MS = 15_000;

/**
 * A job's progress as Server-Sent Events (E6-7): its state now, then after
 * every change, until it's done or failed.
 */
export const GET = route<RouteContext<"/api/jobs/[id]/events">>(async (request, { params }) => {
  const { id } = await params;
  if (!(await getJob(id))) return NextResponse.json({ error: "That job doesn't exist." }, { status: 404 });
  const encoder = new TextEncoder();
  let stop = () => {};

  const stream = new ReadableStream<Uint8Array>({
    async start(controller) {
      let closed = false;
      const heartbeat = setInterval(() => controller.enqueue(encoder.encode(": still working\n\n")), HEARTBEAT_MS);
      stop = () => {
        if (closed) return;
        closed = true;
        clearInterval(heartbeat);
        unsubscribe();
        controller.close();
      };
      const send = (job: JobView) => {
        if (closed) return;
        controller.enqueue(encoder.encode(`data: ${JSON.stringify(job)}\n\n`));
        if (isFinished(job)) stop();
      };
      // Listen before reading, so a change in between isn't missed.
      const unsubscribe = subscribeJob(id, send);
      request.signal.addEventListener("abort", () => stop(), { once: true });
      const job = await getJob(id);
      if (job) send(job);
      else stop();
    },
    cancel() {
      stop();
    },
  });

  return new Response(stream, {
    headers: {
      "content-type": "text/event-stream; charset=utf-8",
      "cache-control": "no-cache, no-transform",
      // Tells nginx (CapRover) not to buffer the stream.
      "x-accel-buffering": "no",
    },
  });
});
