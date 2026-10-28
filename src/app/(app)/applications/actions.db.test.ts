import { afterAll, beforeEach, describe, expect, it, vi } from "vitest";

import { loadSettings } from "@/lib/settings-data";
import { createTestClient, resetDatabase } from "@/test/db";

import { rememberListView } from "./actions";

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

beforeEach(() => resetDatabase(prisma()));
afterAll(() => prisma().$disconnect());

describe("rememberListView (E9-4)", () => {
  it("starts from the board, all applications, latest update first", async () => {
    expect(await loadSettings()).toMatchObject({ applicationsView: "board", applicationsFilter: "all", applicationsSort: "updated" });
  });

  it("saves the view, filter and sort in Settings", async () => {
    expect(await rememberListView({ view: "table", filter: "closed", sort: { key: "match", reversed: true } })).toEqual({ ok: true, data: null });
    expect(await loadSettings()).toMatchObject({ applicationsView: "table", applicationsFilter: "closed", applicationsSort: "-match" });
  });

  it("refuses what the list doesn't know", async () => {
    expect(await rememberListView({ view: "grid" as "board", filter: "all", sort: { key: "updated", reversed: false } })).toMatchObject({ ok: false });
  });
});
