import { describe, expect, it } from "vitest";

import { safeNextPath } from "./next-path";

describe("safeNextPath", () => {
  it("keeps paths on this site, with their query and hash", () => {
    expect(safeNextPath("/applications/abc123")).toBe("/applications/abc123");
    expect(safeNextPath("/profile?section=experience#e1")).toBe("/profile?section=experience#e1");
  });

  it("falls back to the dashboard when there's nothing to go back to", () => {
    expect(safeNextPath(undefined)).toBe("/");
    expect(safeNextPath(null)).toBe("/");
    expect(safeNextPath("")).toBe("/");
    expect(safeNextPath("/login")).toBe("/");
    expect(safeNextPath("/login?next=/profile")).toBe("/");
  });

  it("never leaves the site", () => {
    for (const next of [
      "https://evil.example/",
      "//evil.example",
      "/\\evil.example",
      "/\t/evil.example",
      "javascript:alert(1)",
      "evil.example",
    ]) {
      expect(safeNextPath(next), next).toBe("/");
    }
  });
});
