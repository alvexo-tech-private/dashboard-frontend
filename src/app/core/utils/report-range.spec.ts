import { RANGE_PRESETS, defaultReportRange, fromIsoDate, toIsoDate } from './report-range';

describe('report range helpers', () => {
  it('formats and parses dates in local time, without a UTC day shift', () => {
    const date = new Date(2026, 0, 5, 0, 30);
    expect(toIsoDate(date)).toBe('2026-01-05');
    expect(toIsoDate(fromIsoDate('2026-11-30'))).toBe('2026-11-30');
  });

  it('builds presets relative to today', () => {
    const today = new Date(2026, 2, 15);
    const byLabel = Object.fromEntries(RANGE_PRESETS.map((p) => [p.label, p.range(today)]));
    expect(byLabel['Today']).toEqual({ from: '2026-03-15', to: '2026-03-15' });
    expect(byLabel['Last 7 days']).toEqual({ from: '2026-03-09', to: '2026-03-15' });
    expect(byLabel['This month']).toEqual({ from: '2026-03-01', to: '2026-03-15' });
    expect(byLabel['Last month']).toEqual({ from: '2026-02-01', to: '2026-02-28' });
    expect(defaultReportRange(today)).toEqual({ from: '2026-02-14', to: '2026-03-15' });
  });
});
