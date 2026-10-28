"use client";

import { MatchRows } from "@/components/match-rows";
import { Card } from "@/components/ui/card";
import type { Match, Requirement } from "@/lib/application-data";

/** "How you match" in the new application's review (E7-4), with a word on gaps. */
export function MatchCard({
  match,
  requirements,
  onAddSkill,
}: {
  match: Match;
  /** The extracted requirements, in the same order as the match's items. */
  requirements: Requirement[];
  onAddSkill: (index: number, skill: string) => void;
}) {
  return (
    <Card padding="none" className="flex flex-col px-7 pt-6 pb-3">
      <MatchRows match={match} requirements={requirements} onAddSkill={onAddSkill} />
      <p className="border-t border-line py-3 text-meta text-muted">
        Gaps aren&apos;t dealbreakers. I&apos;ll never invent experience. The important ones get addressed honestly in your cover letter.
      </p>
    </Card>
  );
}
