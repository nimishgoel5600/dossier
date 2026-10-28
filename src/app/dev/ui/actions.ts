"use server";

import { z } from "zod";

import { action, ActionError } from "@/lib/action";

/** Shows how an action's toast and errors reach the client; used by /dev/ui only. */
export const demoAction = action(
  z.object({ outcome: z.enum(["success", "error", "crash"]) }),
  async ({ outcome }, { toast }) => {
    if (process.env.NODE_ENV === "production") throw new ActionError("Not available.");
    if (outcome === "error") throw new ActionError("That didn't work. This is an error an action reports.");
    if (outcome === "crash") throw new Error("An unexpected failure, logged on the server.");
    toast("Saved on the server. This toast came from the action's result.");
    return { savedAt: new Date().toISOString() };
  },
);
