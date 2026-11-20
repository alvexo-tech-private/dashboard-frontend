import { Component, computed, effect, input, signal, untracked } from '@angular/core';
import { Router } from '@angular/router';
import { CurrencyPipe, DatePipe } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatChipsModule } from '@angular/material/chips';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSelectModule } from '@angular/material/select';
import { MatTableModule } from '@angular/material/table';
import { MatTabsModule } from '@angular/material/tabs';
import { MatTooltipModule } from '@angular/material/tooltip';
import {
  ReportFilters,
  ReportRange,
  SETTLEMENT_STATUSES,
  SettlementLine,
  SettlementReport,
  SettlementStatus,
  SettlementWorkshopRow,
  statusLabel,
} from '../../../core/models/report';
import { ReportPath, ReportService } from '../../../core/services/report.service';
import { httpErrorMessage } from '../../../core/utils/http-error-message';
import { defaultReportRange } from '../../../core/utils/report-range';
import { ExportMenu } from '../../../shared/export-menu/export-menu';
import { ReportRangePicker } from '../../../shared/report-range/report-range';

type View = 'by-workshop' | 'lines';
const VIEWS: View[] = ['by-workshop', 'lines'];
const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/;

/**
 * Settlement report (ADMIN-US-20) with export (US-22): settlements by
 * settlement date, as a workshop-wise summary or the booking lines behind it.
 * Selecting a workshop drills down to its lines (BR-10). Read-only — the
 * amounts are the booking API's stored values. Finance Admin / Super Admin only.
 */
@Component({
  selector: 'app-finance-reports',
  imports: [
    CurrencyPipe,
    DatePipe,
    MatButtonModule,
    MatCardModule,
    MatChipsModule,
    MatFormFieldModule,
    MatIconModule,
    MatPaginatorModule,
    MatProgressSpinnerModule,
    MatSelectModule,
    MatTableModule,
    MatTabsModule,
    MatTooltipModule,
    ExportMenu,
    ReportRangePicker,
  ],
  templateUrl: './finance-reports.html',
  styleUrl: './finance-reports.scss',
})
export class FinanceReports {
  // Bound from query params (withComponentInputBinding).
  readonly view = input<string>();
  readonly from = input<string>();
  readonly to = input<string>();
  readonly status = input<string>();
  readonly workshopId = input<string>();

  readonly statuses = SETTLEMENT_STATUSES;
  readonly statusLabel = statusLabel;
  readonly workshopColumns = ['workshop', 'bookings', 'advance', 'fee', 'tcs', 'payout', 'paid', 'outstanding', 'issues'];
  readonly lineColumns = ['date', 'workshop', 'booking', 'advance', 'fee', 'tcs', 'payout', 'status', 'payoutInfo'];
  readonly pageSizeOptions = [10, 20, 50, 100];

  readonly range = signal<ReportRange>(defaultReportRange(), {
    equal: (a, b) => a.from === b.from && a.to === b.to,
  });
  readonly statusFilter = signal<SettlementStatus | null>(null);
  readonly workshop = signal<{ id: number; name: string } | null>(null);
  readonly tabIndex = signal(0);
  readonly pageIndex = signal(0);
  readonly pageSize = signal(20);

  readonly workshopReport = signal<SettlementReport<SettlementWorkshopRow> | null>(null);
  readonly lineReport = signal<SettlementReport<SettlementLine> | null>(null);
  readonly loading = signal(true);
  readonly error = signal<string | null>(null);

  readonly currentView = computed<View>(() => VIEWS[this.tabIndex()]);
  readonly exportPath = computed<ReportPath>(() => `settlements/${this.currentView()}`);
  readonly filters = computed<ReportFilters>(() => ({
    status: this.statusFilter(),
    workshopId: this.workshop()?.id ?? null,
  }));
  /** Totals and status breakdown of whichever view is showing — both cover the same filtered settlements. */
  readonly current = computed(() => (this.currentView() === 'lines' ? this.lineReport() : this.workshopReport()));

  constructor(
    private reportService: ReportService,
    private router: Router,
  ) {
    // Query params -> state, then load. Runs on first open and on back/forward.
    effect(() => {
      const from = this.from();
      const to = this.to();
      const status = this.status();
      const workshopId = Number(this.workshopId());
      const view = this.view();
      untracked(() => {
        if (from && to && ISO_DATE.test(from) && ISO_DATE.test(to) && from <= to) {
          this.range.set({ from, to });
        }
        this.statusFilter.set(SETTLEMENT_STATUSES.includes(status as SettlementStatus) ? (status as SettlementStatus) : null);
        const current = this.workshop();
        if (Number.isInteger(workshopId) && workshopId > 0) {
          if (current?.id !== workshopId) this.workshop.set({ id: workshopId, name: `Workshop #${workshopId}` });
        } else {
          this.workshop.set(null);
        }
        const index = VIEWS.indexOf(view as View);
        this.tabIndex.set(index === -1 ? 0 : index);
        // Our own syncUrl() lands here too; only load when the URL asked for something new.
        if (this.stateKey() !== this.loadedKey) {
          this.pageIndex.set(0);
          this.load();
        }
      });
    });
  }

  /** Filters + view, without paging: what decides whether a reload is needed. */
  private loadedKey = '';
  private stateKey(): string {
    return [this.currentView(), this.range().from, this.range().to, this.statusFilter(), this.workshop()?.id].join('|');
  }

  onRangeChange(range: ReportRange): void {
    this.range.set(range);
    this.reload();
  }

  onStatusChange(status: SettlementStatus | null): void {
    this.statusFilter.set(status);
    this.reload();
  }

  onTabChange(index: number): void {
    this.tabIndex.set(index);
    this.reload();
  }

  /** BR-10 drill-down: a workshop row opens its booking lines. */
  openWorkshop(row: SettlementWorkshopRow): void {
    this.workshop.set({ id: row.workshopId, name: row.workshopName || `Workshop #${row.workshopId}` });
    this.tabIndex.set(VIEWS.indexOf('lines'));
    this.reload();
  }

  clearWorkshop(): void {
    this.workshop.set(null);
    this.reload();
  }

  onPageChange(event: PageEvent): void {
    this.pageIndex.set(event.pageIndex);
    this.pageSize.set(event.pageSize);
    this.load();
  }

  private reload(): void {
    this.pageIndex.set(0);
    this.syncUrl();
    this.load();
  }

  private syncUrl(): void {
    this.router.navigate([], {
      queryParams: {
        view: this.currentView(),
        from: this.range().from,
        to: this.range().to,
        status: this.statusFilter() ?? null,
        workshopId: this.workshop()?.id ?? null,
      },
      replaceUrl: true,
    });
  }

  private load(): void {
    this.loadedKey = this.stateKey();
    this.loading.set(true);
    this.error.set(null);
    const range = this.range();
    const filters = this.filters();
    const done = () => this.loading.set(false);
    const fail = (err: unknown) => {
      this.error.set(httpErrorMessage(err, 'Could not load the settlement report.'));
      this.loading.set(false);
    };

    if (this.currentView() === 'lines') {
      this.reportService.getSettlementLines(range, filters, this.pageIndex(), this.pageSize()).subscribe({
        next: (report) => {
          this.lineReport.set(report);
          // Name the drilled-down workshop when it came from the URL as an id only.
          const first = report.rows.content[0];
          const selected = this.workshop();
          if (selected && first?.workshopId === selected.id && first.workshopName) {
            this.workshop.set({ id: selected.id, name: first.workshopName });
          }
          done();
        },
        error: fail,
      });
    } else {
      this.reportService.getSettlementsByWorkshop(range, filters, this.pageIndex(), this.pageSize()).subscribe({
        next: (report) => {
          this.workshopReport.set(report);
          done();
        },
        error: fail,
      });
    }
  }
}
