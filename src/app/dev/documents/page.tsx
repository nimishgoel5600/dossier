import type { Metadata } from "next";
import { notFound } from "next/navigation";
import type { CSSProperties, ReactNode } from "react";

import { CoverLetterDocument } from "@/components/documents/cover-letter-document";
import { ResumeDocument } from "@/components/documents/resume-document";
import { verifySession } from "@/lib/auth/session";
import { demoLetterUnits, demoProfile, demoResumeUnits } from "@/lib/demo-profile";
import { prisma } from "@/lib/prisma";
import { loadProfile } from "@/lib/profile-data";
import { loadSettings } from "@/lib/settings-data";

export const metadata: Metadata = {
  title: "Documents",
  robots: { index: false },
};

/**
 * Every built-in theme rendering the demo profile (or yours, with
 * `?profile=mine`), plus a tailored resume and a cover letter. Development only.
 */
export default async function DevDocumentsPage({ searchParams }: PageProps<"/dev/documents">) {
  if (process.env.NODE_ENV === "production") notFound();
  await verifySession();
  const { profile: which } = await searchParams;
  const mine = which === "mine";
  const [themes, settings, profile] = await Promise.all([
    prisma.theme.findMany({ where: { builtIn: true }, orderBy: { createdAt: "asc" } }),
    loadSettings(),
    mine ? loadProfile() : demoProfile(),
  ]);
  const editorial = themes.find((theme) => theme.id === "editorial") ?? themes[0];

  return (
    <main className="flex flex-col gap-8 bg-canvas p-10">
      <header className="flex flex-col gap-1">
        <h1 className="font-serif text-title">Documents</h1>
        <p className="text-muted">
          {mine ? "Your profile" : "The demo profile"} in every built-in theme, on{" "}
          {settings.paper === "A4" ? "A4" : "US Letter"} paper.{" "}
          <a className="underline" href={mine ? "/dev/documents" : "/dev/documents?profile=mine"}>
            Show {mine ? "the demo profile" : "your profile"}
          </a>
        </p>
      </header>
      <div className="grid grid-cols-[repeat(auto-fill,minmax(420px,1fr))] gap-8">
        {themes.map((theme) => (
          <Preview key={theme.id} label={`${theme.name} · base resume`}>
            <ResumeDocument theme={theme} profile={profile} paper={settings.paper} />
          </Preview>
        ))}
        {!mine && (
          <>
            <Preview label="Modern · tailored resume, single column">
              <ResumeDocument
                theme={themes.find((theme) => theme.id === "modern") ?? editorial}
                profile={profile}
                paper={settings.paper}
                units={demoResumeUnits()}
                layout="SINGLE"
              />
            </Preview>
            <Preview label="Editorial · tailored resume with references">
              <ResumeDocument
                theme={editorial}
                profile={profile}
                paper={settings.paper}
                units={demoResumeUnits()}
                includeReferences
              />
            </Preview>
            <Preview label="Editorial · cover letter">
              <CoverLetterDocument
                theme={editorial}
                paper={settings.paper}
                basics={profile.basics}
                units={demoLetterUnits()}
                company="Ledgerly"
                location="Amsterdam"
                tone="WARM"
                date={new Date(Date.UTC(2026, 8, 27))}
                dateFormat={settings.dateFormat}
              />
            </Preview>
            <Preview label="Signal · cover letter on a banner">
              <CoverLetterDocument
                theme={themes.find((theme) => theme.id === "signal") ?? editorial}
                paper={settings.paper}
                basics={profile.basics}
                units={demoLetterUnits()}
                company="Ledgerly"
                location="Amsterdam"
                tone="WARM"
                date={new Date(Date.UTC(2026, 8, 27))}
                dateFormat={settings.dateFormat}
              />
            </Preview>
          </>
        )}
      </div>
    </main>
  );
}

function Preview({ label, children }: { label: string; children: ReactNode }) {
  return (
    <section className="@container flex flex-col gap-3">
      <h2 className="text-meta text-muted">{label}</h2>
      <div className="shadow-page w-fit" style={{ "--u": "min(1px, calc(100cqw / 640))" } as CSSProperties}>
        {children}
      </div>
    </section>
  );
}
