/**
 * Campus clock helpers. Every day/hour boundary in the UI is Philippine time,
 * never the server's (Vercel runs the app in UTC).
 *
 * The Philippines stays on UTC+8 year-round, so a fixed offset is exact.
 */
export const PH_TZ = "Asia/Manila";
export const PH_OFFSET_MS = 8 * 60 * 60 * 1000;

/** Calendar fields as seen in Manila. */
export function manilaParts(d: Date): {
  year: number;
  month: number;
  day: number;
  hour: number;
  weekday: number;
} {
  const shifted = new Date(d.getTime() + PH_OFFSET_MS);
  return {
    year: shifted.getUTCFullYear(),
    month: shifted.getUTCMonth(),
    day: shifted.getUTCDate(),
    hour: shifted.getUTCHours(),
    weekday: shifted.getUTCDay(),
  };
}

/** The instant at which the given Manila calendar date begins. */
export function manilaMidnight(year: number, month: number, day: number): Date {
  return new Date(Date.UTC(year, month, day) - PH_OFFSET_MS);
}
