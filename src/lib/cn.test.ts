import { describe, expect, it } from "vitest";

import { cn } from "./cn";

describe("cn", () => {
  it("joins class names and skips falsy values", () => {
    expect(cn("a", false, "b", null, undefined, "", "c")).toBe("a b c");
  });

  it("returns an empty string when nothing is set", () => {
    expect(cn(false, null)).toBe("");
  });
});
