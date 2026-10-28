import { afterAll, beforeEach, describe, expect, it } from "vitest";

import { createTestClient, resetDatabase } from "@/test/db";

import { clientIp } from "./client-ip";
import { GLOBAL_KEY, loginWaitMs, recordLoginFailure, recordLoginSuccess } from "./login-throttle";

const db = createTestClient();
const start = new Date("2026-09-28T09:00:00Z");
const at = (seconds: number) => new Date(start.getTime() + seconds * 1000);

beforeEach(() => resetDatabase(db));
afterAll(() => db.$disconnect());

async function failTimes(ip: string, count: number, from = 0) {
  for (let i = 0; i < count; i++) await recordLoginFailure(db, ip, at(from + i));
}

describe("login throttle", () => {
  it("blocks an IP for 30 s after five quick failures, without affecting other IPs", async () => {
    await failTimes("203.0.113.7", 4);
    expect(await loginWaitMs(db, "203.0.113.7", at(4))).toBe(0);

    await recordLoginFailure(db, "203.0.113.7", at(4));
    expect(await loginWaitMs(db, "203.0.113.7", at(4))).toBe(30_000);
    expect(await loginWaitMs(db, "203.0.113.7", at(34))).toBe(0);
    expect(await loginWaitMs(db, "198.51.100.2", at(4))).toBe(0);
  });

  it("resets the IP's counter after a successful sign-in, but not the global one", async () => {
    await failTimes("203.0.113.7", 4);
    await recordLoginSuccess(db, "203.0.113.7");
    expect(await db.loginThrottle.findUnique({ where: { key: "203.0.113.7" } })).toBeNull();
    expect((await db.loginThrottle.findUniqueOrThrow({ where: { key: GLOBAL_KEY } })).failures).toBe(4);
  });

  it("blocks everyone after 30 failures from many IPs (faked X-Forwarded-For)", async () => {
    for (let i = 0; i < 30; i++) await recordLoginFailure(db, `10.0.0.${i}`, at(i));
    expect(await loginWaitMs(db, "10.0.0.99", at(29))).toBe(30_000);
  });

  it("counts concurrent failures exactly", async () => {
    await Promise.all(Array.from({ length: 5 }, () => recordLoginFailure(db, "203.0.113.7", at(0))));
    expect((await db.loginThrottle.findUniqueOrThrow({ where: { key: "203.0.113.7" } })).failures).toBe(5);
    expect(await loginWaitMs(db, "203.0.113.7", at(0))).toBe(30_000);
  });

  it("prunes rows untouched for a day", async () => {
    await recordLoginFailure(db, "203.0.113.7", at(0));
    await recordLoginFailure(db, "198.51.100.2", at(24 * 60 * 60 + 1));
    expect((await db.loginThrottle.findMany({ select: { key: true }, orderBy: { key: "asc" } })).map((row) => row.key)).toEqual([
      GLOBAL_KEY,
      "198.51.100.2",
    ]);
  });
});

describe("clientIp", () => {
  it("takes the last X-Forwarded-For entry", () => {
    expect(clientIp(new Headers({ "x-forwarded-for": "1.2.3.4, 203.0.113.7" }))).toBe("203.0.113.7");
    expect(clientIp(new Headers({ "x-forwarded-for": "203.0.113.7" }))).toBe("203.0.113.7");
    expect(clientIp(new Headers())).toBe("unknown");
  });
});
