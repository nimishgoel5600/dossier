import { afterAll, beforeEach, describe, expect, it } from "vitest";

import { Prisma } from "@/generated/prisma/client";
import { createTestClient, resetDatabase } from "@/test/db";

import { unitsSchema } from "./application-data";

const db = createTestClient();

beforeEach(() => resetDatabase(db));
afterAll(() => db.$disconnect());

async function createApplication() {
  return db.application.create({
    data: {
      title: "Senior Product Designer · Ledgerly Payments",
      company: "Ledgerly",
      role: "Senior Product Designer",
      deadline: new Date("2026-10-15"),
      events: { create: [{ from: "DRAFT", to: "SENT" }] },
      documents: {
        create: [
          { kind: "RESUME", units: [{ id: "summary", label: "Summary", text: "…" }] },
          { kind: "COVER_LETTER", units: [{ id: "paragraph:1", label: "Opening", text: "…" }] },
        ],
      },
      messages: { create: [{ role: "AI", text: "Here's what I tailored for Ledgerly:" }] },
      notes: { create: [{ body: "Interview with the hiring manager on 3 Oct" }] },
    },
  });
}

describe("application schema", () => {
  it("starts as a draft that was never sent", async () => {
    const application = await db.application.create({ data: {} });
    expect(application).toMatchObject({
      status: "DRAFT",
      furthestStage: null,
      sentAt: null,
      tone: "WARM",
      extracted: null,
      match: null,
      archivedAt: null,
    });
  });

  it("stores document units as JSON that reads back through the schema", async () => {
    const { id } = await createApplication();
    const resume = await db.document.findUniqueOrThrow({
      where: { applicationId_kind: { applicationId: id, kind: "RESUME" } },
    });
    expect(unitsSchema.parse(resume.units)).toEqual([{ id: "summary", label: "Summary", text: "…" }]);
  });

  it("allows one document of each kind per application", async () => {
    const { id } = await createApplication();
    await expect(
      db.document.create({ data: { applicationId: id, kind: "RESUME", units: [] } }),
    ).rejects.toSatisfy(
      (error) => error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002",
    );
  });

  it("deletes an application's events, documents, messages and notes with it", async () => {
    const { id } = await createApplication();
    await db.application.delete({ where: { id } });
    const counts = await Promise.all([
      db.statusEvent.count(),
      db.document.count(),
      db.chatMessage.count(),
      db.note.count(),
    ]);
    expect(counts).toEqual([0, 0, 0, 0]);
  });

  it("keeps a document when its theme is deleted, falling back to the base theme", async () => {
    const theme = await db.theme.create({
      data: { name: "Mine", headFont: "GEIST", bodyFont: "GEIST", accent: "#2f5d8a" },
    });
    const { id } = await createApplication();
    await db.document.updateMany({ where: { applicationId: id }, data: { themeId: theme.id } });
    await db.theme.delete({ where: { id: theme.id } });
    expect(await db.document.findMany({ select: { themeId: true } })).toEqual([
      { themeId: null },
      { themeId: null },
    ]);
  });
});
