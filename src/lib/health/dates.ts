// Dates are always the user's LOCAL calendar date. Using UTC here would save
// yesterday's date for anyone recording before 08:00 in Hong Kong.

function pad(n: number) {
  return String(n).padStart(2, "0");
}

/** Local calendar date as yyyy-mm-dd. */
export function todayIso(d: Date = new Date()): string {
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

/** Same as todayIso but for an arbitrary Date — keeps local, never UTC. */
export const toIsoDate = todayIso;

/**
 * Add whole months, clamping the day so 31 Jan + 1 month is 28/29 Feb
 * instead of overflowing into March.
 */
export function addMonthsClamped(isoDate: string, months: number): Date {
  const [y, m, d] = isoDate.split("-").map(Number) as [number, number, number];
  const target = new Date(y, m - 1 + months, 1);
  const lastDay = new Date(target.getFullYear(), target.getMonth() + 1, 0).getDate();
  target.setDate(Math.min(d, lastDay));
  return target;
}
