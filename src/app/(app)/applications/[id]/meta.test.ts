import { describe, expect, it } from "vitest";

import { metaLine } from "./meta";

const application = {
  location: "Amsterdam",
  mode: "Hybrid · 3 days in office",
  salary: "€75–90k",
  deadline: new Date("2026-10-15T00:00:00Z"),
  createdAt: new Date(2026, 8, 27, 10),
};

describe("metaLine (APP-1)", () => {
  it("lists location, work mode, salary, deadline and creation date", () => {
    expect(metaLine(application)).toEqual([
      "Amsterdam",
      "Hybrid · 3 days in office",
      "€75–90k",
      "Apply by 15 Oct 2026",
      "Created 27 Sep 2026",
    ]);
  });

  it("leaves out what isn't known", () => {
    expect(metaLine({ ...application, location: " ", salary: "", deadline: null })).toEqual([
      "Hybrid · 3 days in office",
      "Created 27 Sep 2026",
    ]);
  });
});
