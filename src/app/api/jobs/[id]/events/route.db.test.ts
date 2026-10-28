import { NextRequest } from "next/server";
import { afterAll, beforeEach, describe, expect, it, vi } from "vitest";
import { z } from "zod";

import { getSession } from "@/lib/auth/session";
import { defineJob, startJob } from "@/lib/jobs/runner";
import { createTestClient, resetDatabase } from "@/test/db";

import { GET as getJobState } from "../route";
import { GET } from "./route";

const db = vi.hoisted(() => ({ client: undefined as ReturnType<typeof createTestClient> | undefined }));
vi.mock("@/lib/prisma", async () => {
  const { createTestClient } = await import("@/test/db");
  db.client = createTestClient();
  return { prisma: db.client };
});
vi.mock("@/lib/auth/session", () => ({ getSession: vi.fn() }));
vi.mock("@/lib/ai/config", () => ({ loadAiConfig: async () => ({ provider: "LOCAL" }) }));

/** Holds the job after its step until the test opens it; made before each job starts, so opening can't come too early. */
let gate = { opened: Promise.resolve(), open: () => {} };
function newGate() {
  let open = () => {};
  const opened = new Promise<void>((resolve) => (open = resolve));
  gate = { opened, open };
}
const job = defineJob({
  type: "test-stream",
  input: z.object({}),
  result: z.object({ ok: z.boolean() }),
  async run(_, { step }) {
    await step("Thinking");
    await gate.opened;
    return { ok: true };
  },
});

const context = (id: string) => ({ params: Promise.resolve({ id }) });
const request = (path: string) => new NextRequest(`http://localhost:3000${path}`);

/** Every `data:` event until the stream ends, releasing the job once it's running. */
async function readEvents(response: Response): Promise<{ status: string; step: string | null }[]> {
  const reader = response.body!.getReader();
  const decoder = new TextDecoder();
  const events: { status: string; step: string | null }[] = [];
  let buffer = "";
  for (;;) {
    const { value, done } = await reader.read();
    if (done) return events;
    buffer += decoder.decode(value, { stream: true });
    for (const chunk of buffer.split("\n\n").slice(0, -1)) {
      if (chunk.startsWith("data: ")) {
        const event = JSON.parse(chunk.slice(6));
        events.push({ status: event.status, step: event.step });
        if (event.step === "Thinking") gate.open();
      }
    }
    buffer = buffer.slice(buffer.lastIndexOf("\n\n") + 2);
  }
}

beforeEach(async () => {
  newGate();
  await resetDatabase(db.client!);
  vi.mocked(getSession).mockResolvedValue({ persistent: false, issuedAt: new Date(), expiresAt: new Date(Date.now() + 60_000) });
});
afterAll(() => db.client!.$disconnect());

describe("GET /api/jobs/[id]/events", () => {
  it("streams the job's state after every change and ends when it's done (E6-7)", async () => {
    const id = await startJob(job, {});
    const response = await GET(request(`/api/jobs/${id}/events`), context(id));
    expect(response.headers.get("content-type")).toBe("text/event-stream; charset=utf-8");
    const events = await readEvents(response);
    expect(events).toContainEqual({ status: "RUNNING", step: "Thinking" });
    expect(events.at(-1)).toEqual({ status: "DONE", step: "Thinking" });
  });

  it("answers 404 for a job that doesn't exist, and 401 when signed out", async () => {
    expect((await GET(request("/api/jobs/nope/events"), context("nope"))).status).toBe(404);
    vi.mocked(getSession).mockResolvedValue(null);
    expect((await GET(request("/api/jobs/nope/events"), context("nope"))).status).toBe(401);
  });
});

describe("GET /api/jobs/[id]", () => {
  it("returns the job's state for polling", async () => {
    const id = await startJob(job, {});
    const response = await getJobState(request(`/api/jobs/${id}`), context(id));
    expect(await response.json()).toMatchObject({ id, type: "test-stream", status: expect.stringMatching(/QUEUED|RUNNING/) });
    gate.open();
  });
});
