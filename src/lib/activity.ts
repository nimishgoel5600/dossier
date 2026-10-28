import type { ApplicationStatus } from "@/generated/prisma/enums";
import { formatShortDate } from "@/lib/dates";

// An application's notes and history (E8-9, APP-14): private notes merged
// with its status changes and when it was created, newest first. Dates are
// formatted here, on the server.

export type ActivityEntry =
  | { kind: "note"; id: string; body: string; date: string; edited: boolean }
  | { kind: "status"; id: string; status: ApplicationStatus; date: string }
  | { kind: "created"; id: "created"; date: string };

/** Saving a new note sets both times a moment apart; only a later save counts as an edit. */
const EDIT_AFTER_MS = 2000;

export function activityTimeline({
  notes,
  events,
  createdAt,
  now = new Date(),
}: {
  notes: { id: string; body: string; createdAt: Date; updatedAt: Date }[];
  events: { id: string; to: ApplicationStatus; at: Date }[];
  createdAt: Date;
  now?: Date;
}): ActivityEntry[] {
  const dated: { at: Date; entry: ActivityEntry }[] = [
    ...notes.map((note) => ({
      at: note.createdAt,
      entry: {
        kind: "note" as const,
        id: note.id,
        body: note.body,
        date: formatShortDate(note.createdAt, now),
        edited: note.updatedAt.getTime() - note.createdAt.getTime() > EDIT_AFTER_MS,
      },
    })),
    ...events.map((event) => ({
      at: event.at,
      entry: { kind: "status" as const, id: event.id, status: event.to, date: formatShortDate(event.at, now) },
    })),
    { at: createdAt, entry: { kind: "created" as const, id: "created" as const, date: formatShortDate(createdAt, now) } },
  ];
  // Newest first; the creation always last, even when a status changed the same moment.
  return dated
    .sort((a, b) => (a.entry.kind === "created" ? 1 : b.entry.kind === "created" ? -1 : b.at.getTime() - a.at.getTime()))
    .map(({ entry }) => entry);
}
