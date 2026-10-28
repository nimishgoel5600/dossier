import "server-only";

import { randomUUID } from "node:crypto";

import { contentDisposition } from "@/lib/file-name";

// Rendered PDFs waiting to be downloaded. The download button has the server
// render first, so it can say it's busy and show errors, then lets the
// browser fetch the file from its own link: a file made inside the page
// saved empty in Chrome and Edge on Windows when they asked where to save.
// Held a few minutes rather than once, in case a browser asks twice.

/** How long a rendered PDF waits for its download. */
export const HOLD_MS = 5 * 60_000;
/** The most PDFs held at once; the oldest goes first. */
const MAX_HELD = 20;

type Held = { pdf: Uint8Array; fileName: string; expires: number };

// Kept on globalThis so the dev server's hot reloads don't drop them.
const globalForHeld = globalThis as unknown as { heldPdfs?: Map<string, Held> };
const held: Map<string, Held> = (globalForHeld.heldPdfs ??= new Map());

function dropExpired(now: number): void {
  for (const [id, file] of held) if (file.expires <= now) held.delete(id);
}

/** Keeps a rendered PDF for its download; returns the id to fetch it by. */
export function holdPdf(pdf: Uint8Array, fileName: string, now = Date.now()): string {
  dropExpired(now);
  while (held.size >= MAX_HELD) held.delete(held.keys().next().value!);
  const id = randomUUID();
  held.set(id, { pdf, fileName, expires: now + HOLD_MS });
  return id;
}

/** A held PDF, or null once it has expired. */
export function heldPdf(id: string, now = Date.now()): { pdf: Uint8Array; fileName: string } | null {
  dropExpired(now);
  const file = held.get(id);
  return file ? { pdf: file.pdf, fileName: file.fileName } : null;
}

/** A PDF as a download named `fileName`. */
export function pdfDownload(pdf: Uint8Array, fileName: string): Response {
  return new Response(Buffer.from(pdf), {
    headers: {
      "content-type": "application/pdf",
      "content-disposition": contentDisposition(fileName),
    },
  });
}
