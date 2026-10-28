"use server";

import { z } from "zod";

import { action } from "@/lib/action";
import { FILTERS, SORT_KEYS, VIEWS } from "@/lib/applications-list";
import { saveSettings } from "@/lib/settings-data";

/** Remembers how the Applications screen was left (LST-7), for the next visit. */
export const rememberListView = action(
  z.object({
    view: z.enum(VIEWS),
    filter: z.enum(FILTERS.map((filter) => filter.value)),
    sort: z.object({ key: z.enum(SORT_KEYS), reversed: z.boolean() }),
  }),
  async ({ view, filter, sort }) => {
    await saveSettings({
      applicationsView: view,
      applicationsFilter: filter,
      applicationsSort: `${sort.reversed ? "-" : ""}${sort.key}`,
    });
    return null;
  },
);
