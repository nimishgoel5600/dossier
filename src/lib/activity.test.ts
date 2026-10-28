import { describe, expect, it } from "vitest";

import { activityTimeline } from "./activity";

const at = (day: number, hour = 10) => new Date(2026, 9, day, hour);

describe("activityTimeline (E8-9)", () => {
  it("merges notes and status changes, newest first, with the creation last", () => {
    const timeline = activityTimeline({
      notes: [
        { id: "n1", body: "Called John.", createdAt: at(3, 15), updatedAt: at(3, 15) },
        { id: "n2", body: "Sent a thank-you.", createdAt: at(1), updatedAt: at(2) },
      ],
      events: [
        { id: "e1", to: "SENT", at: at(1, 9) },
        { id: "e2", to: "INTERVIEW", at: at(3, 9) },
      ],
      createdAt: at(1, 9),
      now: at(5),
    });
    expect(timeline).toEqual([
      { kind: "note", id: "n1", body: "Called John.", date: "3 Oct", edited: false },
      { kind: "status", id: "e2", status: "INTERVIEW", date: "3 Oct" },
      { kind: "note", id: "n2", body: "Sent a thank-you.", date: "1 Oct", edited: true },
      { kind: "status", id: "e1", status: "SENT", date: "1 Oct" },
      { kind: "created", id: "created", date: "1 Oct" },
    ]);
  });

  it("adds the year to dates from another year", () => {
    const [created] = activityTimeline({ notes: [], events: [], createdAt: new Date(2025, 11, 30), now: at(5) });
    expect(created).toEqual({ kind: "created", id: "created", date: "30 Dec 2025" });
  });
});
