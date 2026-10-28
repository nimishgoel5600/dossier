import { afterAll, beforeEach, describe, expect, it, vi } from "vitest";

import { revalidatePath } from "next/cache";

import { createTestClient, resetDatabase } from "@/test/db";

import { setStatus, undoStatus } from "./status-actions";

const db = vi.hoisted(() => ({ client: undefined as ReturnType<typeof createTestClient> | undefined }));
vi.mock("@/lib/prisma", async () => {
  const { createTestClient } = await import("@/test/db");
  db.client = createTestClient();
  return { prisma: db.client };
});
vi.mock("@/lib/auth/session", () => ({
  getSession: async () => ({ persistent: false, issuedAt: new Date(), expiresAt: new Date(Date.now() + 60_000) }),
}));
vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }));

const prisma = () => db.client!;

beforeEach(async () => {
  vi.mocked(revalidatePath).mockClear();
  await resetDatabase(prisma());
  await prisma().application.create({ data: { id: "app-1", company: "Ledgerly" } });
});
afterAll(() => prisma().$disconnect());

describe("setStatus and undoStatus (E2-5, DSH-6)", () => {
  it("moves an application with the status's toast, and refreshes every page", async () => {
    const result = await setStatus({ id: "app-1", to: "SENT" });
    expect(result).toMatchObject({ ok: true, toast: "Marked as sent. Fingers crossed!", data: { eventId: expect.any(String) } });
    expect(revalidatePath).toHaveBeenCalledWith("/", "layout");
    expect(await prisma().application.findUniqueOrThrow({ where: { id: "app-1" } })).toMatchObject({ status: "SENT", furthestStage: "SENT" });
  });

  it("records nothing when the status stays", async () => {
    expect(await setStatus({ id: "app-1", to: "DRAFT" })).toEqual({ ok: true, data: { eventId: null } });
    expect(await prisma().statusEvent.count()).toBe(0);
  });

  it("undoes a change, as long as nothing came after it", async () => {
    const sent = await setStatus({ id: "app-1", to: "SENT" });
    const eventId = sent.ok ? sent.data.eventId! : "";
    expect(await undoStatus({ eventId })).toMatchObject({ ok: true, toast: "Moved back to draft.", data: { status: "DRAFT" } });
    expect(await prisma().application.findUniqueOrThrow({ where: { id: "app-1" } })).toMatchObject({ status: "DRAFT", furthestStage: null, sentAt: null });
  });

  it("refuses to undo a change that was followed by another", async () => {
    const sent = await setStatus({ id: "app-1", to: "SENT" });
    await setStatus({ id: "app-1", to: "SCREENING" });
    expect(await undoStatus({ eventId: sent.ok ? sent.data.eventId! : "" })).toEqual({
      ok: false,
      error: "The status has changed again since, so this change can't be undone.",
    });
  });

  it("says so when the application is gone", async () => {
    expect(await setStatus({ id: "gone", to: "SENT" })).toEqual({ ok: false, error: "That application no longer exists." });
    expect(await undoStatus({ eventId: "gone" })).toEqual({ ok: false, error: "That application no longer exists." });
  });
});
