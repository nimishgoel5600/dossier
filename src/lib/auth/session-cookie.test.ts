import { beforeEach, describe, expect, it, vi } from "vitest";

import { endSession, getSession, SESSION_COOKIE, SESSION_LIFETIME, startSession, verifySession } from "./session";

const jar = vi.hoisted(() => ({ values: new Map<string, string>(), set: vi.fn(), remove: vi.fn(), proto: null as string | null }));
vi.mock("next/headers", () => ({
  cookies: async () => ({
    get: (name: string) => (jar.values.has(name) ? { name, value: jar.values.get(name)! } : undefined),
    set: (name: string, value: string, options: object) => {
      jar.values.set(name, value);
      jar.set(name, value, options);
    },
    delete: (name: string) => {
      jar.values.delete(name);
      jar.remove(name);
    },
  }),
  headers: async () => new Headers(jar.proto ? { "x-forwarded-proto": jar.proto } : {}),
}));
vi.mock("next/navigation", () => ({
  redirect: (to: string) => {
    throw new Error(`redirect ${to}`);
  },
}));
vi.mock("@/lib/env", () => ({ env: { DOSSIER_SECRET: "s".repeat(32), DOSSIER_PASSWORD: "correct horse" } }));
// React's per-request cache would keep the first answer across tests.
vi.mock("react", async (importOriginal) => ({ ...(await importOriginal<typeof import("react")>()), cache: <T,>(fn: T) => fn }));

beforeEach(() => {
  jar.values.clear();
  jar.set.mockClear();
  jar.remove.mockClear();
  jar.proto = null;
});

describe("the session cookie (E3-1)", () => {
  it("starts a browser session: an HTTP-only, same-site cookie without an expiry", async () => {
    await startSession({ persistent: false });
    expect(jar.set).toHaveBeenCalledWith(SESSION_COOKIE, expect.any(String), { httpOnly: true, sameSite: "lax", path: "/", secure: false });
    expect(await getSession()).toMatchObject({ persistent: false });
  });

  it("keeps a remembered session for 30 days, secure behind an HTTPS proxy", async () => {
    jar.proto = "https, http";
    await startSession({ persistent: true });
    expect(jar.set).toHaveBeenCalledWith(SESSION_COOKIE, expect.any(String), expect.objectContaining({ secure: true, maxAge: SESSION_LIFETIME.persistent }));
  });

  it("reads no session from a missing or forged cookie", async () => {
    expect(await getSession()).toBeNull();
    jar.values.set(SESSION_COOKIE, "not-a-token");
    expect(await getSession()).toBeNull();
  });

  it("sends visitors without a session to the sign-in page", async () => {
    await expect(verifySession()).rejects.toThrow("redirect /login");
    await startSession({ persistent: false });
    await expect(verifySession()).resolves.toMatchObject({ persistent: false });
  });

  it("ends the session by deleting the cookie", async () => {
    await startSession({ persistent: false });
    await endSession();
    expect(jar.remove).toHaveBeenCalledWith(SESSION_COOKIE);
    expect(await getSession()).toBeNull();
  });
});
