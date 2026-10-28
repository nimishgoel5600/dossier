import "server-only";

import { jwtVerify, SignJWT } from "jose";

import { deriveKey } from "@/lib/keys";

// Headless Chromium has no session cookie. It reaches a print page with a
// short-lived token instead, signed with a key derived from DOSSIER_SECRET
// and bound to that one page, sent in a request header so it never shows up
// in a URL or a log.

export const PRINT_TOKEN_HEADER = "x-dossier-print-token";
export const PRINT_TOKEN_LIFETIME_SECONDS = 60;

const AUDIENCE = "dossier-print";

/** A token that opens `path` (e.g. "/print/base") for a minute. */
export async function signPrintToken(path: string, secret?: string): Promise<string> {
  return new SignJWT({ path })
    .setProtectedHeader({ alg: "HS256" })
    .setAudience(AUDIENCE)
    .setIssuedAt()
    .setExpirationTime(`${PRINT_TOKEN_LIFETIME_SECONDS}s`)
    .sign(deriveKey("print-token", secret));
}

/** Whether `token` is a valid, unexpired print token for exactly `path`. */
export async function verifyPrintToken(
  token: string | null | undefined,
  path: string,
  { secret, now }: { secret?: string; now?: Date } = {},
): Promise<boolean> {
  if (!token) return false;
  try {
    const { payload } = await jwtVerify(token, deriveKey("print-token", secret), {
      audience: AUDIENCE,
      algorithms: ["HS256"],
      currentDate: now,
    });
    return payload.path === path;
  } catch {
    return false;
  }
}
