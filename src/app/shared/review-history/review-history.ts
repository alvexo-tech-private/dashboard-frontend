import { Component, effect, input, signal, untracked } from '@angular/core';
import { DatePipe } from '@angular/common';
import { RouterLink } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { PeopleDetailService } from '../../core/services/people-detail.service';
import { ReviewRow } from '../../core/models/people-detail';
import { httpErrorMessage } from '../../core/utils/http-error-message';

/**
 * Read-only reviews (ADMIN-US-09 BR-10 "feedback"): the reviews a rider wrote,
 * or the reviews a workshop received, newest first, with the workshop's reply.
 */
@Component({
  selector: 'app-review-history',
  imports: [DatePipe, RouterLink, MatIconModule, MatProgressSpinnerModule, MatPaginatorModule],
  templateUrl: './review-history.html',
  styleUrl: './review-history.scss',
})
export class ReviewHistory {
  readonly userId = input.required<number>();
  readonly perspective = input.required<'rider' | 'workshop'>();

  readonly stars = [1, 2, 3, 4, 5];
  readonly rows = signal<ReviewRow[]>([]);
  readonly loading = signal(true);
  readonly error = signal<string | null>(null);
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

  onPageChange(event: PageEvent): void {
    this.pageIndex.set(event.pageIndex);
    this.pageSize.set(event.pageSize);
    this.load(this.userId());
  }

  private load(userId: number): void {
    this.loading.set(true);
    this.error.set(null);
    this.peopleDetailService.getReviews(userId, this.pageIndex(), this.pageSize()).subscribe({
      next: (result) => {
        this.rows.set(result.content);
        this.totalElements.set(result.totalElements);
        this.loading.set(false);
      },
      error: (err) => {
        this.error.set(httpErrorMessage(err, 'Could not load reviews.'));
        this.loading.set(false);
      },
    });
  }
}
