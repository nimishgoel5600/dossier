import { describe, expect, it, vi } from "vitest";

import { AiError, toAiError } from "../errors";

import { keyGuardedFetch, REDIRECT_REFUSED } from "./guarded-fetch";

const redirect = (status: number, location: string) => new Response(null, { status, headers: { location } });

describe("keyGuardedFetch (E11-5)", () => {
  it("passes answers through, never following redirects by itself", async () => {
    const fetch = vi.fn(async () => Response.json({ ok: true }));
    const response = await keyGuardedFetch(fetch)("https://api.example.com/v1/models", { headers: { authorization: "Bearer sk" } });
    expect(await response.json()).toEqual({ ok: true });
    expect(fetch).toHaveBeenCalledWith(new URL("https://api.example.com/v1/models"), expect.objectContaining({ redirect: "manual" }));
  });

  it("refuses to follow a redirect to another host with the key", async () => {
    const fetch = vi.fn(async () => redirect(307, "https://evil.example.net/steal"));
    await expect(keyGuardedFetch(fetch)("https://api.example.com/v1/chat", { method: "POST", body: "{}" })).rejects.toThrow(REDIRECT_REFUSED);
    expect(fetch).toHaveBeenCalledTimes(1);
  });

  it("follows a same-origin redirect that keeps the request", async () => {
    const fetch = vi.fn().mockResolvedValueOnce(redirect(308, "/v2/chat")).mockResolvedValueOnce(Response.json({ ok: true }));
    await keyGuardedFetch(fetch)("https://api.example.com/v1/chat", { method: "POST", body: "{}" });
    expect(fetch).toHaveBeenLastCalledWith(new URL("https://api.example.com/v2/chat"), expect.objectContaining({ method: "POST", body: "{}" }));
  });

  it("refuses a redirect that would change the request, and loops", async () => {
    await expect(keyGuardedFetch(vi.fn(async () => redirect(302, "/elsewhere")))("https://api.example.com/v1/chat")).rejects.toThrow(REDIRECT_REFUSED);
    await expect(keyGuardedFetch(vi.fn(async () => redirect(307, "/v1/chat")))("https://api.example.com/v1/chat")).rejects.toThrow(REDIRECT_REFUSED);
  });

  it("keeps its message when an SDK wraps the error", () => {
    const wrapped = new Error("Connection error.", { cause: AiError.config(REDIRECT_REFUSED) });
    expect(toAiError(wrapped, { model: "m" }).message).toBe(REDIRECT_REFUSED);
  });
});
