import { describe, expect, it } from "vitest";

import { ApplicationStatus as S, FunnelStage } from "@/generated/prisma/enums";

import {
  advance,
  FUNNEL_STAGES,
  heardBack,
  isInProgress,
  STATUSES,
  statusInfo,
  undoChange,
  type StatusFields,
} from "./status";

const now = new Date("2026-09-27T12:00:00Z");
const earlier = new Date("2026-09-01T09:00:00Z");
const draft: StatusFields = { status: S.DRAFT, furthestStage: null, sentAt: null };

/** Applies a series of moves and returns the final fields. */
function moves(start: StatusFields, ...statuses: S[]): StatusFields {
  return statuses.reduce((fields, to) => advance(fields, to, now)?.update ?? fields, start);
}

describe("status list", () => {
  it("lists all eight statuses in order, with labels, colours, groups and toasts", () => {
    expect(STATUSES.map((status) => status.label)).toEqual([
      "Draft",
      "Sent",
      "Screening",
      "Interview",
      "Offer",
      "Accepted",
      "Rejected",
      "Declined",
    ]);
    expect(STATUSES).toHaveLength(Object.keys(S).length);
    expect(statusInfo(S.INTERVIEW)).toMatchObject({
      color: "var(--color-status-interview)",
      toast: "An interview! You've got this.",
    });
    expect(STATUSES.filter((status) => isInProgress(status.value)).map((status) => status.label)).toEqual([
      "Draft",
      "Sent",
      "Screening",
      "Interview",
      "Offer",
    ]);
    expect(FUNNEL_STAGES).toEqual(["SENT", "SCREENING", "INTERVIEW", "OFFER", "ACCEPTED"]);
  });
});

describe("advance", () => {
  it("does nothing when the status doesn't change", () => {
    expect(advance(draft, S.DRAFT, now)).toBeNull();
    expect(advance({ status: S.OFFER, furthestStage: "OFFER", sentAt: earlier }, S.OFFER, now)).toBeNull();
  });

  it("marks a draft as sent on its first move out of Draft", () => {
    expect(advance(draft, S.SENT, now)).toEqual({
      update: { status: S.SENT, furthestStage: "SENT", sentAt: now },
      event: { from: S.DRAFT, to: S.SENT, at: now, previousFurthestStage: null, previousSentAt: null },
    });
  });

  it("raises the furthest stage when moving forward, including when skipping stages", () => {
    expect(moves(draft, S.SENT, S.SCREENING, S.INTERVIEW)).toEqual({
      status: S.INTERVIEW,
      furthestStage: "INTERVIEW",
      sentAt: now,
    });
    expect(moves(draft, S.OFFER)).toEqual({ status: S.OFFER, furthestStage: "OFFER", sentAt: now });
  });

  it("never lowers the furthest stage or changes the sent date when moving back", () => {
    const interview: StatusFields = { status: S.INTERVIEW, furthestStage: "INTERVIEW", sentAt: earlier };
    expect(moves(interview, S.SCREENING, S.DRAFT)).toEqual({
      status: S.DRAFT,
      furthestStage: "INTERVIEW",
      sentAt: earlier,
    });
  });

  it("keeps the stage reached when an application is rejected or declined", () => {
    const screening: StatusFields = { status: S.SCREENING, furthestStage: "SCREENING", sentAt: earlier };
    expect(moves(screening, S.REJECTED)).toEqual({
      status: S.REJECTED,
      furthestStage: "SCREENING",
      sentAt: earlier,
    });
    const offer: StatusFields = { status: S.OFFER, furthestStage: "OFFER", sentAt: earlier };
    expect(moves(offer, S.DECLINED)).toEqual({ status: S.DECLINED, furthestStage: "OFFER", sentAt: earlier });
  });

  it("counts Draft → Rejected as sent", () => {
    expect(moves(draft, S.REJECTED)).toEqual({ status: S.REJECTED, furthestStage: "SENT", sentAt: now });
  });

  it("keeps a draft the user declined out of the funnel, until it's sent after all", () => {
    expect(moves(draft, S.DECLINED)).toEqual({ status: S.DECLINED, furthestStage: null, sentAt: null });
    expect(moves(draft, S.DECLINED, S.SENT)).toEqual({ status: S.SENT, furthestStage: "SENT", sentAt: now });
  });

  it("records the previous fields so the change can be undone", () => {
    const screening: StatusFields = { status: S.SCREENING, furthestStage: "SCREENING", sentAt: earlier };
    const change = advance(screening, S.OFFER, now)!;
    expect(change.update).toEqual({ status: S.OFFER, furthestStage: "OFFER", sentAt: earlier });
    expect(undoChange(change.event)).toEqual(screening);
    expect(undoChange(advance(draft, S.SENT, now)!.event)).toEqual(draft);
  });
});

describe("heardBack", () => {
  it("is true from Screening on", () => {
    expect(heardBack({ furthestStage: null })).toBe(false);
    expect(heardBack({ furthestStage: FunnelStage.SENT })).toBe(false);
    expect(heardBack({ furthestStage: FunnelStage.SCREENING })).toBe(true);
    expect(heardBack({ furthestStage: FunnelStage.ACCEPTED })).toBe(true);
  });
});
