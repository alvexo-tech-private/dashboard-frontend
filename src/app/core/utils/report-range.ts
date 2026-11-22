import { ReportRange } from '../models/report';

/** yyyy-MM-dd in the browser's local time (toISOString would shift the day for India, UTC+5:30). */
export function toIsoDate(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

/** Parses yyyy-MM-dd as a local date (new Date('2026-11-01') would be UTC midnight). */
export function fromIsoDate(value: string): Date {
  const [y, m, d] = value.split('-').map(Number);
  return new Date(y, m - 1, d);
}

export interface RangePreset {
  label: string;
  range: (today: Date) => ReportRange;
}

function daysBefore(today: Date, days: number): Date {
  return new Date(today.getFullYear(), today.getMonth(), today.getDate() - days);
}

export const RANGE_PRESETS: RangePreset[] = [
  { label: 'Today', range: (t) => ({ from: toIsoDate(t), to: toIsoDate(t) }) },
  { label: 'Last 7 days', range: (t) => ({ from: toIsoDate(daysBefore(t, 6)), to: toIsoDate(t) }) },
  { label: 'Last 30 days', range: (t) => ({ from: toIsoDate(daysBefore(t, 29)), to: toIsoDate(t) }) },
  {
    label: 'This month',
    range: (t) => ({ from: toIsoDate(new Date(t.getFullYear(), t.getMonth(), 1)), to: toIsoDate(t) }),
  },
  {
    label: 'Last month',
    range: (t) => ({
      from: toIsoDate(new Date(t.getFullYear(), t.getMonth() - 1, 1)),
      to: toIsoDate(new Date(t.getFullYear(), t.getMonth(), 0)),
    }),
  },
];

/** Reports open on the last 30 days. */
export function defaultReportRange(today = new Date()): ReportRange {
  return RANGE_PRESETS[2].range(today);
}
