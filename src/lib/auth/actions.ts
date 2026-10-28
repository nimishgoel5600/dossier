"use server";

import { redirect } from "next/navigation";

import { endSession } from "./session";

/** Signs out from the sidebar (PRD AUTH-7). */
export async function signOut(): Promise<void> {
  await endSession();
  redirect("/login");
}
