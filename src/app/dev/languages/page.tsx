import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { DocumentPreview } from "@/components/documents/document-preview";
import { ResumeDocument } from "@/components/documents/resume-document";
import { verifySession } from "@/lib/auth/session";
import { LANGUAGE_SAMPLES, sampleProfile } from "@/lib/language-samples";
import { BUILT_IN_THEMES, printCss } from "@/lib/themes";

export const metadata: Metadata = {
  title: "Document languages",
  robots: { index: false },
};

/**
 * A sample resume in every built-in document language (E5-8), in any
 * built-in theme (`?theme=modern`). `?only=Persian` shows one on its own,
 * ready to print. Development only.
 */
export default async function DevLanguagesPage({ searchParams }: PageProps<"/dev/languages">) {
  if (process.env.NODE_ENV === "production") notFound();
  await verifySession();
  const { theme: themeId, only } = await searchParams;
  const theme = BUILT_IN_THEMES.find((entry) => entry.id === themeId) ?? BUILT_IN_THEMES[0];

  if (typeof only === "string") {
    const sample = LANGUAGE_SAMPLES.find((entry) => entry.language === only);
    if (!sample) notFound();
    return (
      <>
        <style>{printCss(theme, "A4")}</style>
        <ResumeDocument theme={theme} profile={sampleProfile(sample)} paper="A4" language={sample.language} />
      </>
    );
  }

  return (
    <main className="flex flex-col gap-8 bg-canvas p-10">
      <header className="flex flex-col gap-2">
        <h1 className="font-serif text-title">Document languages</h1>
        <p className="text-muted">
          Every built-in language in the {theme.name} theme. Themes:{" "}
          {BUILT_IN_THEMES.map((entry, index) => (
            <span key={entry.id}>
              {index > 0 && " · "}
              <a className="underline" href={`/dev/languages?theme=${entry.id}`}>
                {entry.name}
              </a>
            </span>
          ))}
        </p>
      </header>
      <div className="grid grid-cols-[repeat(auto-fill,minmax(420px,1fr))] gap-8">
        {LANGUAGE_SAMPLES.map((sample) => (
          <DocumentPreview key={sample.language} label={sample.language} meta={theme.name} className="p-0">
            <ResumeDocument theme={theme} profile={sampleProfile(sample)} paper="A4" language={sample.language} />
          </DocumentPreview>
        ))}
      </div>
    </main>
  );
}
