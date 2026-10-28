import { mkdtemp, readdir, rm, utimes, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";

import { afterAll, beforeEach, describe, expect, it, vi } from "vitest";

import { loadSettings, saveSettings } from "@/lib/settings-data";
import { createTestClient, resetDatabase } from "@/test/db";

import { lastNightlyBackup, nextRun, pruneBackups, runNightlyBackup } from "./backup-schedule";

const db = vi.hoisted(() => ({ client: undefined as ReturnType<typeof createTestClient> | undefined }));
vi.mock("@/lib/prisma", async () => {
  const { createTestClient } = await import("@/test/db");
  db.client = createTestClient();
  return { prisma: db.client };
});
const dataDir = vi.hoisted(() => ({ path: "" }));
vi.mock("@/lib/env", () => ({
  env: { get DOSSIER_DATA_DIR() { return dataDir.path; }, DOSSIER_BACKUP_RETENTION_DAYS: 14, DOSSIER_SECRET: "s".repeat(32) },
}));
vi.mock("@/lib/log", () => ({ logServerError: vi.fn() }));

const prisma = () => db.client!;
const backups = () => readdir(path.join(dataDir.path, "backups")).catch(() => [] as string[]);

beforeEach(async () => {
  dataDir.path = await mkdtemp(path.join(tmpdir(), "dossier-backups-"));
  await resetDatabase(prisma());
  await prisma().application.create({ data: { company: "Ledgerly" } });
});
afterAll(async () => {
  await rm(dataDir.path, { recursive: true, force: true });
  await prisma().$disconnect();
});

describe("nightly backups (E10-7)", () => {
  it("run at the next 03:00", () => {
    expect(nextRun(new Date(2026, 8, 28, 1, 30))).toEqual(new Date(2026, 8, 28, 3, 0));
    expect(nextRun(new Date(2026, 8, 28, 3, 0))).toEqual(new Date(2026, 8, 29, 3, 0));
    expect(nextRun(new Date(2026, 8, 28, 22, 0))).toEqual(new Date(2026, 8, 29, 3, 0));
  });

  it("write an export while they're on", async () => {
    const now = new Date(2026, 8, 28, 3, 0);
    expect(await runNightlyBackup(now)).toBe("written");
    expect(await backups()).toEqual(["dossier-backup-nightly-2026-09-28-030000.json"]);
    expect(await lastNightlyBackup()).toBeInstanceOf(Date);
  });

  it("write nothing while they're off", async () => {
    await saveSettings({ nightlyBackup: false });
    expect(await runNightlyBackup()).toBe("off");
    expect(await backups()).toEqual([]);
  });

  it("remove backups past the retention", async () => {
    const dir = path.join(dataDir.path, "backups");
    await runNightlyBackup(new Date(2026, 8, 28, 3));
    const old = path.join(dir, "dossier-backup-nightly-2026-09-01-030000.json");
    await writeFile(old, "{}");
    const monthAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    await utimes(old, monthAgo, monthAgo);
    expect(await pruneBackups(new Date())).toBe(1);
    expect(await backups()).toEqual(["dossier-backup-nightly-2026-09-28-030000.json"]);
  });

  it("keep a failure for the settings row, and clear it after a success", async () => {
    // A file where the folder should be: the backup can't be written.
    await writeFile(path.join(dataDir.path, "backups"), "not a folder");
    await expect(runNightlyBackup()).rejects.toThrow();
    expect((await loadSettings()).backupProblem).toMatch(/EEXIST|ENOTDIR/);

    await rm(path.join(dataDir.path, "backups"));
    await runNightlyBackup();
    expect((await loadSettings()).backupProblem).toBeNull();
  });
});
