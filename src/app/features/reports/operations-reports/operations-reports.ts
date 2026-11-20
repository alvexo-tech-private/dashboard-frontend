import { Component, effect, input, signal } from '@angular/core';
import { Router } from '@angular/router';
import { MatTabsModule } from '@angular/material/tabs';
import { ReportRange } from '../../../core/models/report';
import { defaultReportRange } from '../../../core/utils/report-range';
import { ReportRangePicker } from '../../../shared/report-range/report-range';
import { BookingsReport } from '../bookings-report/bookings-report';
import { RegistrationsReport } from '../registrations-report/registrations-report';
import { WorkshopPerformanceReport } from '../workshop-performance-report/workshop-performance-report';

const TABS = ['bookings', 'registrations', 'workshop-performance'] as const;
const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/;

/**
 * Operations reports: bookings, new registrations and workshop performance
 * over one shared date range. The tab and range live in the URL
 * (?tab=&from=&to=) so dashboard tiles can link straight to a filtered report.
 */
@Component({
  selector: 'app-operations-reports',
  imports: [MatTabsModule, ReportRangePicker, BookingsReport, RegistrationsReport, WorkshopPerformanceReport],
  templateUrl: './operations-reports.html',
  styleUrl: './operations-reports.scss',
})
export class OperationsReports {
  // Bound from query params (withComponentInputBinding).
  readonly tab = input<string>();
  readonly from = input<string>();
  readonly to = input<string>();

  // Equal ranges count as unchanged, so writing the range back from the URL doesn't reload the report.
  readonly range = signal<ReportRange>(defaultReportRange(), {
    equal: (a, b) => a.from === b.from && a.to === b.to,
  });
  readonly tabIndex = signal(0);

  constructor(private router: Router) {
    effect(() => {
      const from = this.from();
      const to = this.to();
      if (from && to && ISO_DATE.test(from) && ISO_DATE.test(to) && from <= to) {
        this.range.set({ from, to });
      }
      const index = TABS.indexOf(this.tab() as (typeof TABS)[number]);
      this.tabIndex.set(index === -1 ? 0 : index);
    });
  }

  onRangeChange(range: ReportRange): void {
    this.range.set(range);
    this.syncUrl();
  }

  onTabChange(index: number): void {
    this.tabIndex.set(index);
    this.syncUrl();
  }

  private syncUrl(): void {
    this.router.navigate([], {
      queryParams: { tab: TABS[this.tabIndex()], from: this.range().from, to: this.range().to },
      replaceUrl: true,
    });
  }
}
