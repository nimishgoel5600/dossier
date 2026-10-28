import { ApplicationStatus } from "@/generated/prisma/enums";
import { STATUSES, statusInfo } from "@/lib/status";

// The Applications screen (E9): its views, filters and sorting, kept in the
// URL (?view=&filter=&q=&sort=&archived=) so links can be shared and back and
// forward work.

export const VIEWS = ["board", "table"] as const;
export type View = (typeof VIEWS)[number];

export const FILTERS = [
  { value: "all", label: "All" },
  { value: "active", label: "In progress" },
  { value: "closed", label: "Closed" },
] as const;
export type Filter = (typeof FILTERS)[number]["value"];

/** The statuses a filter shows, in board order. */
export function statusesIn(filter: Filter): ApplicationStatus[] {
  return STATUSES.filter(
    (status) => filter === "all" || (filter === "active" ? status.group === "in-progress" : status.group === "closed"),
  ).map((status) => status.value);
}

/** The table's sortable columns. */
export const SORT_KEYS = ["role", "status", "match", "location", "sent", "updated"] as const;
export type SortKey = (typeof SORT_KEYS)[number];
/** A column and whether it's reversed from its natural order, which comes first. */
export type Sort = { key: SortKey; reversed: boolean };

/**
 * Each column's natural order, the one a first click gives: text A to Z,
 * statuses in pipeline order, and the best match or the latest date first.
 */
export const NATURAL_ORDER: Record<SortKey, "ascending" | "descending"> = {
  role: "ascending",
  status: "ascending",
  match: "descending",
  location: "ascending",
  sent: "descending",
  updated: "descending",
};

export const DEFAULT_SORT: Sort = { key: "updated", reversed: false };

export type ListParams = { view: View; filter: Filter; q: string; sort: Sort; archived: boolean };

const one = (value: string | string[] | undefined) => (Array.isArray(value) ? value[0] : value);

/** The list's state from the URL, e.g. `sort=-match` for the match column reversed. */
export function parseListParams(params: Record<string, string | string[] | undefined>): Partial<ListParams> & { q: string } {
  const view = VIEWS.find((entry) => entry === one(params.view));
  const filter = FILTERS.find((entry) => entry.value === one(params.filter))?.value;
  const rawSort = one(params.sort) ?? "";
  const key = SORT_KEYS.find((entry) => entry === rawSort.replace(/^-/, ""));
  return {
    ...(view ? { view } : {}),
    ...(filter ? { filter } : {}),
    ...(key ? { sort: { key, reversed: rawSort.startsWith("-") } } : {}),
    ...(one(params.archived) === "1" ? { archived: true } : {}),
    q: (one(params.q) ?? "").trim().slice(0, 200),
  };
}

/** A sort as it's written in the URL and in Settings: "updated", "-match". */
export const sortParam = ({ key, reversed }: Sort) => `${reversed ? "-" : ""}${key}`;

/**
 * The list's state (LST-7): what the URL says, then what was last used
 * (Settings), then the defaults. The search and "Show archived" aren't
 * remembered.
 */
export function resolveListParams(
  url: Record<string, string | string[] | undefined>,
  remembered: { applicationsView: string; applicationsFilter: string; applicationsSort: string },
): ListParams {
  const last = parseListParams({ view: remembered.applicationsView, filter: remembered.applicationsFilter, sort: remembered.applicationsSort });
  return { view: "board", filter: "all", sort: DEFAULT_SORT, archived: false, ...last, ...parseListParams(url) };
}

/** The URL for a state; defaults are left out, so the plain page is `/applications`. */
export function listHref({ view, filter, q, sort, archived }: ListParams): string {
  const params = new URLSearchParams();
  if (view !== "board") params.set("view", view);
  if (filter !== "all") params.set("filter", filter);
  if (q) params.set("q", q);
  if (sort.key !== DEFAULT_SORT.key || sort.reversed) params.set("sort", sortParam(sort));
  if (archived) params.set("archived", "1");
  const query = params.toString();
  return query ? `/applications?${query}` : "/applications";
}

/** What the list needs to sort a row. */
export type Sortable = {
  role: string;
  company: string;
  status: ApplicationStatus;
  /** Requirements covered, out of all (e.g. 5/7), or null when not matched. */
  match: { hit: number; total: number } | null;
  location: string;
  sentAt: Date | null;
  updatedAt: Date;
};

const statusRank = (status: ApplicationStatus) => STATUSES.findIndex((entry) => entry.value === status);
const matchRatio = (match: Sortable["match"]) => (match && match.total > 0 ? match.hit / match.total : -1);
const text = (value: string) => value.trim().toLocaleLowerCase();

/**
 * Sorts rows for the table (LST-5). Rows that were never sent stay last
 * under Sent, whichever way it's sorted; ties go to the latest update.
 */
export function sortRows<T extends Sortable>(rows: readonly T[], { key, reversed }: Sort): T[] {
  const direction = (NATURAL_ORDER[key] === "ascending" ? 1 : -1) * (reversed ? -1 : 1);
  const compare = (a: T, b: T): number => {
    switch (key) {
      case "role":
        return text(a.role || a.company).localeCompare(text(b.role || b.company)) * direction;
      case "status":
        return (statusRank(a.status) - statusRank(b.status)) * direction;
      case "match":
        return (matchRatio(a.match) - matchRatio(b.match)) * direction;
      case "location":
        return text(a.location).localeCompare(text(b.location)) * direction;
      case "sent":
        if (!a.sentAt || !b.sentAt) return (a.sentAt ? 0 : 1) - (b.sentAt ? 0 : 1);
        return (a.sentAt.getTime() - b.sentAt.getTime()) * direction;
      case "updated":
        return (a.updatedAt.getTime() - b.updatedAt.getTime()) * direction;
    }
  };
  return [...rows].sort((a, b) => compare(a, b) || b.updatedAt.getTime() - a.updatedAt.getTime());
}

/**
 * "9 applications: 2 waiting to hear back, 2 in conversation. Nice
 * momentum." (LST-1): waiting is Sent and Screening, in conversation is
 * Interview and Offer.
 */
export function listSummary(statuses: readonly ApplicationStatus[]): string {
  if (statuses.length === 0) return "No applications yet. Paste a job posting and I'll tailor your resume and cover letter to it.";
  const count = (...wanted: ApplicationStatus[]) => statuses.filter((status) => wanted.includes(status)).length;
  const waiting = count(ApplicationStatus.SENT, ApplicationStatus.SCREENING);
  const talking = count(ApplicationStatus.INTERVIEW, ApplicationStatus.OFFER);
  const total = `${statuses.length} ${statuses.length === 1 ? "application" : "applications"}`;
  return `${total}: ${waiting} waiting to hear back, ${talking} in conversation.${talking > 0 ? " Nice momentum." : ""}`;
}

/** "Today", "Yesterday", "3 days ago", "2 weeks ago", counting calendar days in the server's time zone. */
export function updatedAgo(date: Date, now = new Date()): string {
  const day = (value: Date) => Date.UTC(value.getFullYear(), value.getMonth(), value.getDate());
  const days = Math.max(0, Math.round((day(now) - day(date)) / 86_400_000));
  if (days === 0) return "Today";
  if (days === 1) return "Yesterday";
  if (days < 14) return `${days} days ago`;
  return `${Math.round(days / 7)} weeks ago`;
}

export const statusLabel = (status: ApplicationStatus) => statusInfo(status).label;
