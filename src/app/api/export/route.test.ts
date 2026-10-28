import { NextRequest } from "next/server";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { getSession } from "@/lib/auth/session";
import { buildExport } from "@/lib/data-export";

import { GET } from "./route";

vi.mock("@/lib/auth/session", () => ({ getSession: vi.fn() }));
vi.mock("@/lib/prisma", () => ({ prisma: {} }));
vi.mock("@/lib/data-export", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@/lib/data-export")>()),
  buildExport: vi.fn(async () => ({ format: "dossier-export", schemaVersion: 1 })),
}));

const get = (query = "") => GET(new NextRequest(`http://localhost:3000/api/export${query}`), undefined);

beforeEach(() => {
  vi.mocked(getSession).mockResolvedValue({ persistent: false, issuedAt: new Date(), expiresAt: new Date() });
  vi.mocked(buildExport).mockClear();
});

describe("GET /api/export (E10-4)", () => {
  it("downloads the export as a dated JSON file, without the API key", async () => {
    const response = await get();
    expect(response.status).toBe(200);
    expect(response.headers.get("content-type")).toBe("application/json; charset=utf-8");
    expect(response.headers.get("content-disposition")).toMatch(/^attachment; filename="dossier-export-\d{4}-\d{2}-\d{2}\.json"/);
    expect(response.headers.get("cache-control")).toBe("private, no-store");
    expect(buildExport).toHaveBeenCalledWith({}, expect.objectContaining({ includeApiKey: false }));
    expect(await response.json()).toEqual({ format: "dossier-export", schemaVersion: 1 });
  });

  it("includes the API key only when asked", async () => {
    await get("?apiKey=1");
    expect(buildExport).toHaveBeenCalledWith({}, expect.objectContaining({ includeApiKey: true }));
  });

  it("needs a session", async () => {
    vi.mocked(getSession).mockResolvedValue(null);
    expect((await get()).status).toBe(401);
  });
});
