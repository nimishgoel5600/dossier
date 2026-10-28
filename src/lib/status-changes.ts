import "server-only";

import type { PrismaClient, StatusEvent } from "@/generated/prisma/client";
import type { ApplicationStatus } from "@/generated/prisma/enums";

import { advance, undoChange } from "./status";

// Database side of the status model: every status change is written here, in
// a transaction, together with its StatusEvent.

export type StatusChangeResult =
  | { outcome: "changed"; event: StatusEvent }
  | { outcome: "unchanged" }
  | { outcome: "not-found" };

/** Moves an application to `to` and records the change. */
export async function applyStatusChange(
  db: PrismaClient,
  applicationId: string,
  to: ApplicationStatus,
  now = new Date(),
): Promise<StatusChangeResult> {
  return db.$transaction(async (tx) => {
    // Lock the row so two changes to the same application can't interleave.
    await tx.$queryRaw`SELECT 1 FROM "Application" WHERE id = ${applicationId} FOR UPDATE`;
    const application = await tx.application.findUnique({
      where: { id: applicationId },
      select: { status: true, furthestStage: true, sentAt: true },
    });
    if (!application) return { outcome: "not-found" };

    const change = advance(application, to, now);
    if (!change) return { outcome: "unchanged" };

    await tx.application.update({ where: { id: applicationId }, data: change.update });
    const event = await tx.statusEvent.create({ data: { applicationId, ...change.event } });
    return { outcome: "changed", event };
  });
}

export type UndoResult =
  | { outcome: "undone"; status: ApplicationStatus }
  | { outcome: "superseded" }
  | { outcome: "not-found" };

/**
 * Undoes a status change: restores the status, furthest stage and sent date
 * from before it and deletes its event. Only the application's latest change
 * can be undone; after a newer one, the result is "superseded".
 */
export async function undoStatusChange(db: PrismaClient, eventId: string): Promise<UndoResult> {
  return db.$transaction(async (tx) => {
    const event = await tx.statusEvent.findUnique({ where: { id: eventId } });
    if (!event) return { outcome: "not-found" };

    await tx.$queryRaw`SELECT 1 FROM "Application" WHERE id = ${event.applicationId} FOR UPDATE`;
    const latest = await tx.statusEvent.findFirst({
      where: { applicationId: event.applicationId },
      orderBy: [{ at: "desc" }, { id: "desc" }],
      select: { id: true },
    });
    if (latest?.id !== event.id) return { outcome: "superseded" };

    const restored = undoChange(event);
    await tx.application.update({ where: { id: event.applicationId }, data: restored });
    await tx.statusEvent.delete({ where: { id: event.id } });
    return { outcome: "undone", status: restored.status };
  });
}
