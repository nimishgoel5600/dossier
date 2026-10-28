import { Tone } from "@/generated/prisma/enums";

/** Cover letter tones (NEW-6, SET-6), with the sign-off each one uses (APP-10). */
export const TONES: Record<Tone, { label: string; description: string; signOff: string }> = {
  [Tone.WARM]: { label: "Warm", description: "Personal and upbeat.", signOff: "Warm regards," },
  [Tone.DIRECT]: { label: "Direct", description: "Short sentences, straight to the point.", signOff: "Best," },
  [Tone.FORMAL]: { label: "Formal", description: "Traditional and polished.", signOff: "Kind regards," },
};
