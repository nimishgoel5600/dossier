// "Good morning" in the user's local time (DSH-1). The browser remembers its
// time zone in a cookie, so the server can greet correctly too.

export type DayPeriod = "morning" | "afternoon" | "evening";

export const TIME_ZONE_COOKIE = "dossier-tz";

export function dayPeriod(hour: number): DayPeriod {
  return hour >= 5 && hour < 12 ? "morning" : hour >= 12 && hour < 18 ? "afternoon" : "evening";
}

/** The hour in a time zone; the server's own when the zone is missing or unknown. */
export function hourIn(timeZone: string | undefined, now = new Date()): number {
  try {
    const hour = new Intl.DateTimeFormat("en-GB", { hour: "numeric", hourCycle: "h23", timeZone }).format(now);
    return Number(hour);
  } catch {
    return now.getHours();
  }
}
