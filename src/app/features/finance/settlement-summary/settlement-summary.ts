import { Component, computed, inject, signal } from '@angular/core';
import { CurrencyPipe, DatePipe } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatTableModule } from '@angular/material/table';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatButtonToggleModule } from '@angular/material/button-toggle';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatDialog } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { HttpErrorResponse } from '@angular/common/http';
import { FinanceService } from '../../../core/services/finance.service';
import { AuthService } from '../../../core/services/auth.service';
import { AdminRole } from '../../../core/models/admin-role';
import { OfflineClosureRequest, SettlementBatchDetail, SettlementBatchRow } from '../../../core/models/finance';
import { httpErrorMessage } from '../../../core/utils/http-error-message';
import { OfflineClosureDialog } from '../offline-closure-dialog/offline-closure-dialog';
import { todayIso } from '../finance-dates';

type StatusFilter = 'ALL' | 'PENDING' | 'PROCESSING' | 'COMPLETED' | 'FAILED' | 'EXCEPTION';

/**
 * ADMIN-US-13 — Workshop Settlement Summary. Workshop-wise consolidated batches for a date; selecting one shows
 * its bookings (each linking to the Booking Financial Breakdown) and history. Amounts are read-only; a Super Admin
 * can close a batch paid outside the gateway (offline closure).
 */
@Component({
  selector: 'app-settlement-summary',
  imports: [MatCardModule, MatIconModule, MatTableModule, MatFormFieldModule, MatInputModule, MatButtonModule,
    MatButtonToggleModule, MatProgressSpinnerModule, CurrencyPipe, DatePipe],
  templateUrl: './settlement-summary.html',
  styleUrl: './settlement-summary.scss',
})
export class SettlementSummary {
  private readonly finance = inject(FinanceService);
  private readonly auth = inject(AuthService);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly dialog = inject(MatDialog);
  private readonly snackBar = inject(MatSnackBar);

  readonly columns = ['workshop', 'batch', 'bookings', 'gross', 'charges', 'adjustments', 'net', 'status', 'gateway'];
  readonly bookingColumns = ['booking', 'rider', 'advance', 'charges', 'net', 'status', 'payment'];

  readonly date = signal(todayIso());
  readonly statusFilter = signal<StatusFilter>('ALL');
  readonly search = signal('');
  readonly rows = signal<SettlementBatchRow[]>([]);
  readonly loading = signal(true);
  readonly error = signal<string | null>(null);

  readonly selected = signal<string | null>(null);
  readonly detail = signal<SettlementBatchDetail | null>(null);
  readonly detailLoading = signal(false);
  readonly closing = signal(false);

  readonly isSuperAdmin = computed(() => this.auth.currentRole() === AdminRole.SUPER_ADMIN);
  readonly canClose = computed(() => {
    const d = this.detail();
    return this.isSuperAdmin() && !!d && d.batch.status !== 'COMPLETED';
  });

  constructor() {
    const q = this.route.snapshot.queryParamMap;
    if (q.get('date')) this.date.set(q.get('date')!);
    this.load(q.get('batch'));
  }

  onDateChange(value: string): void {
    if (!value) return;
    this.date.set(value);
    this.clearSelection();
    this.load(null);
  }

  onStatusChange(value: StatusFilter): void {
    this.statusFilter.set(value);
    this.load(this.selected());
  }

  onSearch(value: string): void {
    this.search.set(value);
    this.load(this.selected());
  }

  select(row: SettlementBatchRow): void {
    this.selected.set(row.batchReference);
    this.loadDetail(row.batchReference);
  }

  openBooking(bookingNumber: string | null, bookingId: number): void {
    this.router.navigate(['/finance/booking-breakdown'], { queryParams: { booking: bookingNumber || bookingId } });
  }

  closeOffline(): void {
    const d = this.detail();
    if (!d) return;
    this.dialog
      .open<OfflineClosureDialog, SettlementBatchRow, OfflineClosureRequest>(OfflineClosureDialog, { data: d.batch })
      .afterClosed()
      .subscribe((request) => {
        if (!request) return;
        this.closing.set(true);
        this.finance.closeOffline(d.batch.batchReference, request).subscribe({
          next: (updated) => {
            this.closing.set(false);
            this.detail.set(updated);
            this.snackBar.open(`${updated.batch.batchReference} closed as paid.`, 'OK', { duration: 4000 });
            this.load(updated.batch.batchReference, false);
          },
          error: (e: unknown) => {
            this.closing.set(false);
            const msg = e instanceof HttpErrorResponse && e.error?.message ? e.error.message
              : httpErrorMessage(e, 'Could not close the batch. Please try again.');
            this.snackBar.open(msg, 'OK', { duration: 6000 });
          },
        });
      });
  }

  private clearSelection(): void {
    this.selected.set(null);
    this.detail.set(null);
  }

  private load(selectRef: string | null, reloadDetail = true): void {
    this.loading.set(true);
    this.error.set(null);
    const status = this.statusFilter() === 'ALL' ? null : this.statusFilter();
    this.finance.getSettlements(this.date(), status, this.search()).subscribe({
      next: (rows) => {
        this.rows.set(rows);
        this.loading.set(false);
        if (selectRef && reloadDetail) {
          this.selected.set(selectRef);
          this.loadDetail(selectRef);
        }
      },
      error: (e) => {
        this.error.set(httpErrorMessage(e, 'Could not load workshop settlements. Please try again.'));
        this.loading.set(false);
      },
    });
  }

  private loadDetail(ref: string): void {
    this.detailLoading.set(true);
    this.finance.getSettlement(ref).subscribe({
      next: (d) => {
        this.detail.set(d);
        this.detailLoading.set(false);
      },
      error: (e) => {
        this.detail.set(null);
        this.detailLoading.set(false);
        this.snackBar.open(httpErrorMessage(e, 'Could not load the settlement batch.'), 'OK', { duration: 5000 });
      },
    });
  }
}
