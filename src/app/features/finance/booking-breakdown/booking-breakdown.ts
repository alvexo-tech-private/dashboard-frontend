import { Component, inject, signal } from '@angular/core';
import { CurrencyPipe, DatePipe } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { HttpErrorResponse } from '@angular/common/http';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { FinanceService } from '../../../core/services/finance.service';
import { BookingFinance } from '../../../core/models/finance';
import { httpErrorMessage } from '../../../core/utils/http-error-message';

/**
 * ADMIN-US-12 — Booking Financial Breakdown. Open a booking by its BYK Booking ID to see the Cashfree payment,
 * platform charges, any automatic refund and the workshop settlement (linking to its batch). Read-only; there is
 * no refund action — refunds are executed by the gateway under the cancellation rules.
 */
@Component({
  selector: 'app-booking-breakdown',
  imports: [MatCardModule, MatIconModule, MatFormFieldModule, MatInputModule, MatButtonModule,
    MatProgressSpinnerModule, CurrencyPipe, DatePipe],
  templateUrl: './booking-breakdown.html',
  styleUrl: './booking-breakdown.scss',
})
export class BookingBreakdown {
  private readonly finance = inject(FinanceService);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);

  readonly query = signal('');
  readonly data = signal<BookingFinance | null>(null);
  readonly loading = signal(false);
  readonly error = signal<string | null>(null);

  constructor() {
    const ref = this.route.snapshot.queryParamMap.get('booking');
    if (ref) {
      this.query.set(ref);
      this.load(ref);
    }
  }

  onSearch(value: string): void {
    const ref = value.trim();
    this.query.set(ref);
    if (!ref) return;
    this.router.navigate([], { queryParams: { booking: ref }, replaceUrl: true });
    this.load(ref);
  }

  openBatch(): void {
    const s = this.data()?.settlement;
    if (!s?.batchReference) return;
    this.router.navigate(['/finance/settlement-summary'], {
      queryParams: { date: s.settlementDate, batch: s.batchReference },
    });
  }

  private load(ref: string): void {
    this.loading.set(true);
    this.error.set(null);
    this.data.set(null);
    this.finance.getBooking(ref).subscribe({
      next: (d) => {
        this.data.set(d);
        this.loading.set(false);
      },
      error: (e: unknown) => {
        this.loading.set(false);
        this.error.set(e instanceof HttpErrorResponse && e.status === 404
          ? `No booking found for "${ref}". Check the Booking ID (e.g. 1888-TN-0017).`
          : httpErrorMessage(e, 'Could not load this booking. Please try again.'));
      },
    });
  }
}
