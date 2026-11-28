/** Today's date as YYYY-MM-DD in the business zone (India), for the finance date pickers. */
export function todayIso(): string {
  return new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Kolkata' }).format(new Date());
}

/** YYYY-MM-DD for "today minus n days" in the business zone. */
export function daysAgoIso(n: number): string {
  const [y, m, d] = todayIso().split('-').map(Number);
  const dt = new Date(Date.UTC(y, m - 1, d - n));
  return dt.toISOString().slice(0, 10);
}
