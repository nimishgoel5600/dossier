import "server-only";

import type { PrismaClient } from "@/generated/prisma/client";

import { afterFailure, GLOBAL, PER_IP, waitMs, type ThrottleState } from "./throttle";

// Rate limiting for sign-in (PRD AUTH-5), stored in Postgres so limits survive
// restarts without Redis. Each failure counts for the client IP and for all IPs
// together (the key "*").

export const GLOBAL_KEY = "*";
const PRUNE_AFTER_MS = 24 * 60 * 60 * 1000;

/** Milliseconds the client must wait before trying again; 0 when it may try now. */
export async function loginWaitMs(db: PrismaClient, ip: string, now = new Date()): Promise<number> {
  const rows = await db.loginThrottle.findMany({ where: { key: { in: [ip, GLOBAL_KEY] } } });
  return Math.max(0, ...rows.map((row) => waitMs(row, now)));
}

/** Counts a failed attempt for the IP and globally, and prunes stale rows. */
export async function recordLoginFailure(db: PrismaClient, ip: string, now = new Date()): Promise<void> {
  await db.$transaction(async (tx) => {
    // Always the IP first, then the global row, so concurrent failures can't deadlock.
    for (const [key, policy] of [
      [ip, PER_IP],
      [GLOBAL_KEY, GLOBAL],
    ] as const) {
      await tx.$executeRaw`
        INSERT INTO "LoginThrottle" (key, "windowStart", "updatedAt")
        VALUES (${key}, ${now}, ${now})
        ON CONFLICT (key) DO NOTHING`;
      const [row] = await tx.$queryRaw<ThrottleState[]>`
        SELECT failures, "windowStart", "blockedUntil" FROM "LoginThrottle"
        WHERE key = ${key} FOR UPDATE`;
      const next = afterFailure(row.failures === 0 ? null : row, now, policy);
      await tx.loginThrottle.update({ where: { key }, data: { ...next, updatedAt: now } });
    }
    await tx.loginThrottle.deleteMany({
      where: { updatedAt: { lt: new Date(now.getTime() - PRUNE_AFTER_MS) } },
    });
  });
}

/** A successful sign-in resets the IP's counter (the global one runs out by itself). */
export async function recordLoginSuccess(db: PrismaClient, ip: string): Promise<void> {
  await db.loginThrottle.deleteMany({ where: { key: ip } });
}
