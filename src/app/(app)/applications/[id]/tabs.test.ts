import { describe, expect, it } from "vitest";

import { aboutWords, tabFrom } from "./tabs";

describe("tabFrom", () => {
  it("reads ?tab= and falls back to the resume", () => {
    expect(tabFrom("letter")).toBe("letter");
    expect(tabFrom("email")).toBe("email");
    expect(tabFrom("posting")).toBe("posting");
    expect(tabFrom(undefined)).toBe("resume");
    expect(tabFrom("nope")).toBe("resume");
    expect(tabFrom(["letter", "posting"])).toBe("resume");
  });
});

describe("aboutWords", () => {
  it("rounds to the nearest ten", () => {
    expect(aboutWords(["one two three four five six seven eight nine ten", "a ".repeat(274)])).toBe("about 280 words");
  });

  it("counts a short letter exactly", () => {
    expect(aboutWords(["Thank you."])).toBe("about 2 words");
    expect(aboutWords([""])).toBe("about 0 words");
  });
});
