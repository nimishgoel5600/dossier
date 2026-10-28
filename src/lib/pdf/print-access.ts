import "server-only";

import { headers } from "next/headers";

import { verifySession } from "@/lib/auth/session";

import { PRINT_TOKEN_HEADER, verifyPrintToken } from "./print-token";

/**
 * Lets the PDF renderer in with its print token, and anyone signed in (handy
 * for checking a print page in the browser); sends everyone else to /login.
 */
export async function verifyPrintAccess(path: string): Promise<void> {
  const token = (await headers()).get(PRINT_TOKEN_HEADER);
  if (await verifyPrintToken(token, path)) return;
  await verifySession();
}
