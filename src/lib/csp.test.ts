import { describe, expect, it } from "vitest";

import { contentSecurityPolicy, createNonce } from "./csp";

describe("contentSecurityPolicy (E11-5)", () => {
  it("allows scripts only with the nonce, and nothing from other hosts", () => {
    const policy = contentSecurityPolicy("abc");
    expect(policy).toContain("script-src 'self' 'nonce-abc' 'strict-dynamic'");
    expect(policy).toContain("default-src 'self'");
    expect(policy).toContain("frame-ancestors 'none'");
    expect(policy).toContain("object-src 'none'");
    expect(policy).not.toContain("unsafe-eval");
    expect(policy).not.toContain("upgrade-insecure-requests");
  });

  it("allows eval in development, and upgrades requests over HTTPS", () => {
    expect(contentSecurityPolicy("abc", { dev: true })).toContain("'strict-dynamic' 'unsafe-eval'");
    expect(contentSecurityPolicy("abc", { https: true })).toMatch(/; upgrade-insecure-requests$/);
  });
});

describe("createNonce", () => {
  it("is fresh every time", () => {
    const nonces = new Set(Array.from({ length: 50 }, createNonce));
    expect(nonces.size).toBe(50);
    expect([...nonces][0]).toMatch(/^[A-Za-z0-9+/]{22}==$/);
  });
});
