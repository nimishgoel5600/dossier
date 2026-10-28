import { describe, expect, it } from "vitest";

import { dayPeriod, hourIn } from "./greeting";

describe("greeting", () => {
  it("names the part of the day", () => {
    expect([4, 5, 11, 12, 17, 18, 23].map(dayPeriod)).toEqual(["evening", "morning", "morning", "afternoon", "afternoon", "evening", "evening"]);
  });

  it("reads the hour in a time zone, and falls back to the server's", () => {
    const now = new Date("2026-09-28T10:30:00Z");
    expect(hourIn("Europe/Berlin", now)).toBe(12);
    expect(hourIn("America/New_York", now)).toBe(6);
    expect(hourIn("Not/AZone", now)).toBe(now.getHours());
  });
});
