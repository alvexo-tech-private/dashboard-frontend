import { Component, computed, inject, signal } from '@angular/core';
import { CurrencyPipe, DatePipe, DecimalPipe } from '@angular/common';
import { Router } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatTableModule } from '@angular/material/table';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { MatButtonToggleModule } from '@angular/material/button-toggle';
import { MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { provideNativeDateAdapter } from '@angular/material/core';
import { FinanceService } from '../../../core/services/finance.service';
import { FinanceOverview, OverviewCard, TransactionRow } from '../../../core/models/finance';
import { httpErrorMessage } from '../../../core/utils/http-error-message';
import { daysAgoIso, todayIso } from '../finance-dates';

interface CardView {
  key: string;
  label: string;
  icon: string;
  tone: 'blue' | 'purple' | 'green' | 'orange';
  card: OverviewCard;
}

type StatusFilter = 'ALL' | 'PAID' | 'TO_BE_PAID' | 'REFUNDED' | 'NO_PAYMENT';

/**
 * BYK Finance Portal dashboard (client mock-up, 20 Nov 2026): Customer Payments, Workshop Payable, Settled and
 * Refunds for the selected period, each with the change vs the previous period and a trend line, and the recent
 * rider payments by BYK Booking ID. A row opens the Booking Financial Breakdown. Everything is read-only.
 */
@Component({
  selector: 'app-finance-dashboard',
  imports: [MatCardModule, MatIconModule, MatTableModule, MatFormFieldModule, MatInputModule, MatSelectModule,
    MatButtonModule, MatButtonToggleModule, MatPaginatorModule, MatProgressSpinnerModule, MatDatepickerModule,
    CurrencyPipe, DatePipe, DecimalPipe],
  providers: [provideNativeDateAdapter()],
  templateUrl: './finance-dashboard.html',
  styleUrl: './finance-dashboard.scss',
})
export class FinanceDashboard {
  private readonly finance = inject(FinanceService);
  private readonly router = inject(Router);

  readonly periods = [
    { days: 7, label: 'Last 7 Days' },
    { days: 30, label: 'Last 30 Days' },
    { days: 90, label: 'Last 90 Days' },
  ];
  readonly columns = ['booking', 'customer', 'workshop', 'paymentDate', 'amount', 'cashfree', 'status', 'open'];

  readonly periodDays = signal(30);
  readonly overview = signal<FinanceOverview | null>(null);
  readonly cards = signal<CardView[]>([]);
  readonly loading = signal(true);
  readonly error = signal<string | null>(null);

  // "View All" list
  readonly showAll = signal(false);
  readonly allRows = signal<TransactionRow[]>([]);
  readonly allTotal = signal(0);
  readonly allLoading = signal(false);
  readonly pageIndex = signal(0);
  readonly pageSize = signal(10);
  readonly statusFilter = signal<StatusFilter>('ALL');
  // Filters: BYK Booking ID, customer name, payment date (that day only)
  readonly bookingIdFilter = signal('');
  readonly customerFilter = signal('');
  readonly workshopFilter = signal('');
  /** Empty until the admin picks a date — then only that day's payments are listed. */
  readonly paymentDateFilter = signal<Date | null>(null);
  // What's typed but not searched yet.
  readonly bookingIdInput = signal('');
  readonly customerInput = signal('');
  readonly workshopInput = signal('');
  readonly filtersActive = computed(() => !!(this.bookingIdFilter().trim() || this.customerFilter().trim()
    || this.workshopFilter().trim()
    || this.paymentDateFilter() || this.statusFilter() !== 'ALL'));
  /** The full, paginated list is shown for View All or whenever a filter is set. */
  readonly listMode = computed(() => this.showAll() || this.filtersActive());

  constructor() {
    this.load();
  }

  onPeriodChange(days: number): void {
    this.periodDays.set(days);
    this.load();
    if (this.listMode()) {
      this.pageIndex.set(0);
      this.loadAll();
    }
  }

  toggleAll(): void {
    this.showAll.set(!this.showAll());
    if (this.listMode()) {
      this.pageIndex.set(0);
      this.loadAll();
    }
  }

  /** Apply the typed Booking ID / customer name / workshop (Enter or Search). */
  search(): void {
    this.bookingIdFilter.set(this.bookingIdInput().trim());
    this.customerFilter.set(this.customerInput().trim());
    this.workshopFilter.set(this.workshopInput().trim());
    this.reloadList();
  }

  onDateChange(date: Date | null): void {
    this.paymentDateFilter.set(date);
    this.bookingIdFilter.set(this.bookingIdInput().trim());
    this.customerFilter.set(this.customerInput().trim());
    this.workshopFilter.set(this.workshopInput().trim());
    this.reloadList();
  }

  clearDate(): void {
    this.onDateChange(null);
  }

  clearFilters(): void {
    this.bookingIdInput.set('');
    this.customerInput.set('');
    this.workshopInput.set('');
    this.bookingIdFilter.set('');
    this.customerFilter.set('');
    this.workshopFilter.set('');
    this.paymentDateFilter.set(null);
    this.statusFilter.set('ALL');
    this.reloadList();
  }

  private reloadList(): void {
    this.pageIndex.set(0);
    if (this.listMode()) this.loadAll();
  }

  onStatusChange(value: StatusFilter): void {
    this.statusFilter.set(value);
    this.pageIndex.set(0);
    if (this.listMode()) this.loadAll();
  }

  onPage(e: PageEvent): void {
    this.pageIndex.set(e.pageIndex);
    this.pageSize.set(e.pageSize);
    this.loadAll();
  }

  open(row: TransactionRow): void {
    this.router.navigate(['/finance/booking-breakdown'], { queryParams: { booking: row.bookingNumber || row.bookingId } });
  }

  statusLabel(status: string): string {
    return status.replace(/_/g, ' ');
  }

  /** Why a ₹0 booking has no payment (shown under the NO PAYMENT chip). */
  noPaymentReason(detail: string): string {
    switch (detail) {
      case 'SAME_DAY': return 'Same-day booking';
      case 'PICKUP': return 'Pickup booking';
      case 'WALK_IN': return 'Walk-in';
      case 'CANCELLED': return 'Cancelled';
      default: return '';
    }
  }

  /** SVG polyline points for a card's daily trend (120 × 36 box). */
  sparkline(values: number[]): string {
    if (!values.length) return '';
    const max = Math.max(...values, 0);
    const w = 120;
    const h = 36;
    const step = values.length > 1 ? w / (values.length - 1) : w;
    return values
      .map((v, i) => `${(i * step).toFixed(1)},${(max > 0 ? h - 3 - (v / max) * (h - 6) : h - 3).toFixed(1)}`)
      .join(' ');
  }

  private range(): { from: string; to: string } {
    return { from: daysAgoIso(this.periodDays() - 1), to: todayIso() };
  }

  private load(): void {
    this.loading.set(true);
    this.error.set(null);
    const { from, to } = this.range();
    this.finance.getOverview(from, to).subscribe({
      next: (o) => {
        this.overview.set(o);
        this.cards.set([
          { key: 'payments', label: 'Customer Payments', icon: 'credit_card', tone: 'blue', card: o.customerPayments },
          { key: 'payable', label: 'Workshop Payable', icon: 'storefront', tone: 'purple', card: o.workshopPayable },
          { key: 'settled', label: 'Settled', icon: 'check_circle', tone: 'green', card: o.settled },
          { key: 'refunds', label: 'Refunds', icon: 'currency_exchange', tone: 'orange', card: o.refunds },
        ]);
        this.loading.set(false);
      },
      error: (e) => {
        this.error.set(httpErrorMessage(e, 'Could not load the finance dashboard. Please try again.'));
        this.loading.set(false);
      },
    });
  }

  private loadAll(): void {
    this.allLoading.set(true);
    const { from, to } = this.range();
    const filters = {
      bookingId: this.bookingIdFilter(),
      customer: this.customerFilter(),
      workshop: this.workshopFilter(),
      paymentDate: isoDate(this.paymentDateFilter()),
      status: this.statusFilter() === 'ALL' ? null : this.statusFilter(),
    };
    this.finance.getTransactions(from, to, filters, this.pageIndex(), this.pageSize()).subscribe({
      next: (p) => {
        this.allRows.set(p.rows);
        this.allTotal.set(p.total);
        this.allLoading.set(false);
      },
      error: () => {
        this.allRows.set([]);
        this.allTotal.set(0);
        this.allLoading.set(false);
      },
    });
  }
}

/** Local calendar date → YYYY-MM-DD (the date the admin picked, not shifted to UTC). */
function isoDate(d: Date | null): string | undefined {
  if (!d) return undefined;
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}
