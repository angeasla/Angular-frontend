/**
 * Returns the number of inclusive calendar days between two Date objects.
 * Uses Math.round to avoid DST edge cases (same as the dialogs' existing pattern).
 */
export function inclusiveDays(start: Date, end: Date): number {
  return Math.round((end.getTime() - start.getTime()) / 86_400_000) + 1;
}

/**
 * Returns a YYYY-MM-DD string for the given Date in local time.
 */
export function toISODate(d: Date): string {
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd}`;
}

/**
 * Returns whole completed months from start to end (mirrors the existing monthsBetween logic).
 */
export function wholeMonthsBetween(start: Date, end: Date): number {
  let years = end.getFullYear() - start.getFullYear();
  let months = end.getMonth() - start.getMonth();
  if (end.getDate() < start.getDate()) { months -= 1; }
  if (months < 0) { years -= 1; months += 12; }
  return years * 12 + months;
}
