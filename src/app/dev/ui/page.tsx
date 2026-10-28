import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { verifySession } from "@/lib/auth/session";
import { prisma } from "@/lib/prisma";

import { Gallery } from "./gallery";

export const metadata: Metadata = {
  title: "UI primitives",
  robots: { index: false },
};

/** Every UI primitive in every state, for development only. */
export default async function DevUiPage() {
  if (process.env.NODE_ENV === "production") notFound();
  await verifySession();
  const application = await prisma.application.findFirst({
    orderBy: { updatedAt: "desc" },
    select: { id: true, company: true, role: true, status: true },
  });
  return <Gallery application={application} />;
}
