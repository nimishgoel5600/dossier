import { vi } from "vitest";

// A fake HTTP layer for the provider tests: every SDK goes through the
// global fetch, so stubbing it exercises their real request and response
// handling without a server.

export type FakeRequest = { url: URL; method: string; headers: Headers; body: unknown };
export type Route = (request: FakeRequest, signal?: AbortSignal) => Response | Promise<Response>;

export function json(body: unknown, init: ResponseInit = {}): Response {
  const headers = new Headers(init.headers);
  headers.set("content-type", "application/json");
  // Tells the OpenAI and Anthropic SDKs not to retry, so failures are quick.
  if ((init.status ?? 200) >= 400) headers.set("x-should-retry", "false");
  return new Response(JSON.stringify(body), { ...init, headers });
}

/** A fetch that never answers, until its signal gives up. */
export function hang(_: FakeRequest, signal?: AbortSignal): Promise<Response> {
  return new Promise((_, reject) => {
    signal?.addEventListener("abort", () => reject(signal.reason), { once: true });
  });
}

/** The error Node's fetch throws when nothing listens on the port. */
export function refused(): never {
  throw new TypeError("fetch failed", { cause: Object.assign(new Error("connect ECONNREFUSED"), { code: "ECONNREFUSED" }) });
}

/** Replaces fetch with `route`; returns the requests it received. */
export function stubFetch(route: Route): FakeRequest[] {
  const requests: FakeRequest[] = [];
  vi.stubGlobal(
    "fetch",
    vi.fn(async (input: string | URL | Request, init: RequestInit = {}) => {
      const request = input instanceof Request ? input : null;
      const url = new URL(request ? request.url : String(input));
      const raw = init.body ?? (request ? await request.text() : undefined);
      const body = typeof raw === "string" && raw ? JSON.parse(raw) : undefined;
      const fake = { url, method: (init.method ?? request?.method ?? "GET").toUpperCase(), headers: new Headers(init.headers), body };
      requests.push(fake);
      return route(fake, init.signal ?? request?.signal ?? undefined);
    }),
  );
  return requests;
}
