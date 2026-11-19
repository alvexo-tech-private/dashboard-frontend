import { Component, signal } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { DatePipe } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatTabsModule } from '@angular/material/tabs';
import { MatTooltipModule } from '@angular/material/tooltip';
import { PeopleDetailService } from '../../../core/services/people-detail.service';
import { RiderDetail as RiderDetailModel } from '../../../core/models/people-detail';
import { httpErrorMessage } from '../../../core/utils/http-error-message';
import { MaskedPhone } from '../../../shared/masked-phone/masked-phone';
import { AccountStatusChip } from '../../../shared/account-status-chip/account-status-chip';
import { AccountActions } from '../../../shared/account-actions/account-actions';
import { AccountHistory } from '../../../shared/account-history/account-history';
import { BookingHistory } from '../../../shared/booking-history/booking-history';
import { ReviewHistory } from '../../../shared/review-history/review-history';

/**
 * Rider Details (ADMIN-US-08 BR-07) and Rider History (ADMIN-US-09), opened
 * from a row in the Rider Directory. Read-only except the account actions
 * next to the status. Complaint history (US-09 BR-08) is not shown: the
 * booking API has no complaint/support-ticket records for riders yet.
 */
@Component({
  selector: 'app-rider-detail',
  imports: [
    DatePipe,
    RouterLink,
    MatCardModule,
    MatIconModule,
    MatButtonModule,
    MatProgressSpinnerModule,
    MatTabsModule,
    MatTooltipModule,
    MaskedPhone,
    AccountStatusChip,
    AccountActions,
    AccountHistory,
    BookingHistory,
    ReviewHistory,
  ],
  templateUrl: './rider-detail.html',
  styleUrl: './rider-detail.scss',
})
export class RiderDetail {
  readonly rider = signal<RiderDetailModel | null>(null);
  readonly loading = signal(true);
  readonly error = signal<string | null>(null);
  readonly historyRefresh = signal(0);

  private readonly id: number;

  constructor(
    route: ActivatedRoute,
    private router: Router,
    private peopleDetailService: PeopleDetailService,
  ) {
    this.id = Number(route.snapshot.paramMap.get('id'));
    this.load();
  }

  address(r: RiderDetailModel): string {
    return [r.addressLine1, r.addressLine2, r.area, r.city, r.state, r.postalCode]
      .filter((part) => !!part && part.trim())
      .join(', ');
  }

  backToDirectory(): void {
    this.router.navigate(['/riders/directory']);
  }

  onAccountChanged(): void {
    this.historyRefresh.update((n) => n + 1);
    this.peopleDetailService.getRider(this.id).subscribe({
      next: (rider) => this.rider.set(rider),
      error: () => this.load(),
    });
  }

  private load(): void {
    this.loading.set(true);
    this.error.set(null);
    this.peopleDetailService.getRider(this.id).subscribe({
      next: (rider) => {
        this.rider.set(rider);
        this.loading.set(false);
      },
      error: (err) => {
        this.error.set(httpErrorMessage(err, 'Could not load this rider. They may not exist.'));
        this.loading.set(false);
      },
    });
  }
}
