import { Component, computed, effect, input, signal, untracked } from '@angular/core';
import { CurrencyPipe, DatePipe } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatTableModule } from '@angular/material/table';
import { BookingReport, ReportFilters, ReportRange, statusLabel } from '../../../core/models/report';
import { ReportService } from '../../../core/services/report.service';
import { httpErrorMessage } from '../../../core/utils/http-error-message';
import { ExportMenu } from '../../../shared/export-menu/export-menu';

/** Bookings scheduled in the range, with a count per status that doubles as the status filter. */
@Component({
  selector: 'app-bookings-report',
  imports: [
    CurrencyPipe,
    DatePipe,
    MatCardModule,
    MatIconModule,
    MatPaginatorModule,
    MatProgressSpinnerModule,
    MatTableModule,
    ExportMenu,
  ],
  templateUrl: './bookings-report.html',
  styleUrl: './bookings-report.scss',
})
export class BookingsReport {
  readonly range = input.required<ReportRange>();

  readonly columns = ['bookingNumber', 'scheduled', 'rider', 'workshop', 'service', 'status', 'cost', 'advance'];
  readonly pageSizeOptions = [10, 20, 50, 100];
  readonly statusLabel = statusLabel;

  readonly report = signal<BookingReport | null>(null);
  readonly loading = signal(true);
  readonly error = signal<string | null>(null);
  readonly status = signal<string | null>(null);
  readonly pageIndex = signal(0);
  readonly pageSize = signal(20);

  readonly filters = computed<ReportFilters>(() => ({ status: this.status() }));
  /** Counts always cover every status in the range, so the pills stay usable while one is selected. */
  readonly allStatusTotal = computed(() => this.report()?.statusCounts.reduce((sum, s) => sum + s.count, 0) ?? 0);

  constructor(private reportService: ReportService) {
    effect(() => {
      this.range();
      untracked(() => {
        // A new range starts unfiltered, so the per-status counts below are always for this range.
        this.status.set(null);
        this.pageIndex.set(0);
        this.load();
      });
    });
  }

  selectStatus(status: string | null): void {
    this.status.set(this.status() === status ? null : status);
    this.pageIndex.set(0);
    this.load();
  }

  onPageChange(event: PageEvent): void {
    this.pageIndex.set(event.pageIndex);
    this.pageSize.set(event.pageSize);
    this.load();
  }

  private load(): void {
    this.loading.set(true);
    this.error.set(null);
    this.reportService.getBookings(this.range(), this.filters(), this.pageIndex(), this.pageSize()).subscribe({
      next: (report) => {
        if (this.status()) {
          // A status-filtered response only counts that status; keep the
          // whole-range counts from the unfiltered load so every pill keeps its number.
          const previous = this.report();
          this.report.set(previous ? { ...report, statusCounts: previous.statusCounts } : report);
        } else {
          this.report.set(report);
        }
        this.loading.set(false);
      },
      error: (err) => {
        this.error.set(httpErrorMessage(err, 'Could not load the bookings report.'));
        this.loading.set(false);
      },
    });
  }
}
