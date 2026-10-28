/**
 * The client's IP for rate limiting: the last X-Forwarded-For entry. Behind
 * a reverse proxy that appends the address it sees (like CapRover's nginx),
 * that's the real client; without one, Next.js fills the header in from the
 * socket. A client connecting directly can fake it, which is why failures are
 * also limited globally (see GLOBAL in throttle.ts).
 */
export function clientIp(headers: Headers): string {
  const forwarded = headers.get("x-forwarded-for");
  const last = forwarded?.split(",").at(-1)?.trim();
  return last || "unknown";
}
