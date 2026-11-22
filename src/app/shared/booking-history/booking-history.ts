import { Component, effect, input, signal, untracked } from '@angular/core';
import { CurrencyPipe, DatePipe } from '@angular/common';
import { RouterLink } from '@angular/router';
import { MatTableModule } from '@angular/material/table';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { PeopleDetailService } from '../../core/services/people-detail.service';
import { BookingRow, BookingStatus } from '../../core/models/people-detail';
import { httpErrorMessage } from '../../core/utils/http-error-message';

export const BOOKING_STATUS_LABELS: Record<BookingStatus, string> = {
  PENDING: 'Pending',
  CONFIRMED: 'Confirmed',
  IN_PROGRESS: 'In progress',
  COMPLETED: 'Completed',
  CANCELLED: 'Cancelled',
  REJECTED: 'Rejected',
};

/**
 * Paginated, read-only booking history for one rider or one workshop
 * (ADMIN-US-09 BR-04/05), filterable by status. `perspective` decides which
 * party is shown: a rider's page lists the workshop, a workshop's page lists
 * the rider, and each links to that party's own detail page.
 */
@Component({
  selector: 'app-booking-history',
  imports: [
    CurrencyPipe,
    DatePipe,
    RouterLink,
    MatTableModule,
    MatIconModule,
    MatProgressSpinnerModule,
    MatPaginatorModule,
    MatFormFieldModule,
    MatSelectModule,
  ],
  templateUrl: './booking-history.html',
  styleUrl: './booking-history.scss',
})
export class BookingHistory {
  readonly userId = input.required<number>();
  readonly perspective = input.required<'rider' | 'workshop'>();

  readonly statusOptions = Object.entries(BOOKING_STATUS_LABELS) as [BookingStatus, string][];

  readonly rows = signal<BookingRow[]>([]);
  readonly loading = signal(true);
  readonly error = signal<string | null>(null);
  readonly status = signal<BookingStatus | 'ALL'>('ALL');
  readonly pageIndex = signal(0);
  readonly pageSize = signal(10);
  readonly totalElements = signal(0);

  constructor(private peopleDetailService: PeopleDetailService) {
    // Only userId should re-trigger this; load() also reads the paging/filter
    // signals, which must not become dependencies (they reload themselves).
    effect(() => {
      const userId = this.userId();
      untracked(() => this.load(userId));
    });
  }

  statusLabel(status: string): string {
    return BOOKING_STATUS_LABELS[status as BookingStatus] ?? status;
  }

  columns(): string[] {
    return ['bookingNumber', 'scheduledAt', 'party', 'vehicle', 'status', 'cost'];
  }

  onStatusChange(status: BookingStatus | 'ALL'): void {
    this.status.set(status);
    this.pageIndex.set(0);
    this.load(this.userId());
  }

  onPageChange(event: PageEvent): void {
    this.pageIndex.set(event.pageIndex);
    this.pageSize.set(event.pageSize);
    this.load(this.userId());
  }

  private load(userId: number): void {
    this.loading.set(true);
    this.error.set(null);
    this.peopleDetailService.getBookings(userId, this.pageIndex(), this.pageSize(), this.status()).subscribe({
      next: (result) => {
        this.rows.set(result.content);
        this.totalElements.set(result.totalElements);
        this.loading.set(false);
      },
      error: (err) => {
        this.error.set(httpErrorMessage(err, 'Could not load bookings.'));
        this.loading.set(false);
      },
    });
  }
}
