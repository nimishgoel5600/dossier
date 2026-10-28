import { describe, expect, it } from "vitest";

import {
  DEFAULT_SORT,
  listHref,
  listSummary,
  parseListParams,
  resolveListParams,
  sortRows,
  statusesIn,
  updatedAgo,
  type Sortable,
} from "./applications-list";

const row = (id: string, extra: Partial<Sortable> = {}): Sortable & { id: string } => ({
  id,
  role: "Designer",
  company: "Acme",
  status: "SENT",
  match: null,
  location: "",
  sentAt: null,
  updatedAt: new Date(2026, 8, 1),
  ...extra,
});
const ids = (rows: { id: string }[]) => rows.map((entry) => entry.id);

describe("the list's URL (E9-1)", () => {
  it("reads view, filter, search, sort and archived", () => {
    expect(parseListParams({ view: "table", filter: "closed", q: "  ledgerly ", sort: "-match", archived: "1" })).toEqual({
      view: "table",
      filter: "closed",
      q: "ledgerly",
      sort: { key: "match", reversed: true },
      archived: true,
    });
  });

  it("ignores what it doesn't know", () => {
    expect(parseListParams({ view: "grid", filter: "nope", sort: "salary" })).toEqual({ q: "" });
  });

  it("leaves defaults out of links", () => {
    expect(listHref({ view: "board", filter: "all", q: "", sort: DEFAULT_SORT, archived: false })).toBe("/applications");
    expect(listHref({ view: "table", filter: "active", q: "a b", sort: { key: "role", reversed: true }, archived: true })).toBe(
      "/applications?view=table&filter=active&q=a+b&sort=-role&archived=1",
    );
  });
});

describe("filters", () => {
  it("splits the statuses into in progress and closed", () => {
    expect(statusesIn("active")).toEqual(["DRAFT", "SENT", "SCREENING", "INTERVIEW", "OFFER"]);
    expect(statusesIn("closed")).toEqual(["ACCEPTED", "REJECTED", "DECLINED"]);
    expect(statusesIn("all")).toHaveLength(8);
  });
});

describe("sortRows (E9-3)", () => {
  it("sorts the latest update first by default", () => {
    const rows = [row("old", { updatedAt: new Date(2026, 7, 1) }), row("new", { updatedAt: new Date(2026, 8, 20) })];
    expect(ids(sortRows(rows, DEFAULT_SORT))).toEqual(["new", "old"]);
    expect(ids(sortRows(rows, { key: "updated", reversed: true }))).toEqual(["old", "new"]);
  });

  it("puts statuses in pipeline order and the best match first", () => {
    const rows = [row("offer", { status: "OFFER", match: { hit: 3, total: 7 } }), row("draft", { status: "DRAFT", match: { hit: 6, total: 7 } }), row("none")];
    expect(ids(sortRows(rows, { key: "status", reversed: false }))).toEqual(["draft", "none", "offer"]);
    expect(ids(sortRows(rows, { key: "match", reversed: false }))).toEqual(["draft", "offer", "none"]);
  });

  it("keeps never-sent applications last under Sent, both ways", () => {
    const rows = [row("draft"), row("aug", { sentAt: new Date(2026, 7, 10) }), row("sep", { sentAt: new Date(2026, 8, 10) })];
    expect(ids(sortRows(rows, { key: "sent", reversed: false }))).toEqual(["sep", "aug", "draft"]);
    expect(ids(sortRows(rows, { key: "sent", reversed: true }))).toEqual(["aug", "sep", "draft"]);
  });

  it("sorts roles and locations alphabetically, ignoring case", () => {
    const rows = [row("b", { role: "product designer", location: "Utrecht" }), row("a", { role: "Lead", location: "amsterdam" })];
    expect(ids(sortRows(rows, { key: "role", reversed: false }))).toEqual(["a", "b"]);
    expect(ids(sortRows(rows, { key: "location", reversed: false }))).toEqual(["a", "b"]);
  });
});

describe("listSummary (LST-1)", () => {
  it("counts who's waiting and who's talking", () => {
    expect(listSummary(["DRAFT", "SENT", "SCREENING", "INTERVIEW", "OFFER", "REJECTED"])).toBe(
      "6 applications: 2 waiting to hear back, 2 in conversation. Nice momentum.",
    );
    expect(listSummary(["SENT"])).toBe("1 application: 1 waiting to hear back, 0 in conversation.");
  });

  it("has its own words for none", () => {
    expect(listSummary([])).toMatch(/^No applications yet\./);
  });
});

describe("updatedAgo", () => {
  const now = new Date(2026, 8, 28, 9);
  it("says how long ago in days, then weeks", () => {
    expect(updatedAgo(new Date(2026, 8, 28, 1), now)).toBe("Today");
    expect(updatedAgo(new Date(2026, 8, 27, 23), now)).toBe("Yesterday");
    expect(updatedAgo(new Date(2026, 8, 21), now)).toBe("7 days ago");
    expect(updatedAgo(new Date(2026, 8, 7), now)).toBe("3 weeks ago");
  });
});

describe("resolveListParams (E9-4, LST-7)", () => {
  const remembered = { applicationsView: "table", applicationsFilter: "closed", applicationsSort: "-match" };

  it("brings back the view, filter and sort last used", () => {
    expect(resolveListParams({}, remembered)).toEqual({
      view: "table",
      filter: "closed",
      sort: { key: "match", reversed: true },
      q: "",
      archived: false,
    });
  });

  it("lets the URL win", () => {
    expect(resolveListParams({ view: "board", q: "ledg" }, remembered)).toMatchObject({ view: "board", filter: "closed", q: "ledg" });
  });

  it("falls back to the defaults when nothing usable was remembered", () => {
    expect(resolveListParams({}, { applicationsView: "grid", applicationsFilter: "", applicationsSort: "salary" })).toEqual({
      view: "board",
      filter: "all",
      sort: DEFAULT_SORT,
      q: "",
      archived: false,
    });
  });
});
