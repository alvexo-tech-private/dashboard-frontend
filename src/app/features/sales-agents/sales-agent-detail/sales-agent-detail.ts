import { Component, signal } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { CurrencyPipe, DatePipe } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatTabsModule } from '@angular/material/tabs';
import { MatTableModule } from '@angular/material/table';
import { MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { PeopleDetailService } from '../../../core/services/people-detail.service';
import { ReferralRow, SalesAgentDetail as SalesAgentDetailModel } from '../../../core/models/people-detail';
import { httpErrorMessage } from '../../../core/utils/http-error-message';
import { MaskedPhone } from '../../../shared/masked-phone/masked-phone';
import { AccountStatusChip } from '../../../shared/account-status-chip/account-status-chip';
import { AccountActions } from '../../../shared/account-actions/account-actions';
import { AccountHistory } from '../../../shared/account-history/account-history';

const ROLE_LABELS: Record<string, string> = {
  MECHANIC: 'Workshop',
  VEHICLE_USER: 'Rider',
  SALES_REPRESENTATIVE: 'Sales agent',
  ADMINISTRATOR: 'Administrator',
};

/**
 * Sales agent details (ADMIN-US-10 BR-09/10): profile, status, and the
 * accounts (mostly workshops) the agent referred, from the booking API's
 * referrals table. Read-only except the account actions; commission figures
 * belong to Epic 7 and KYC approval to a later story, so neither is here.
 */
@Component({
  selector: 'app-sales-agent-detail',
  imports: [
    CurrencyPipe,
    DatePipe,
    RouterLink,
    MatCardModule,
    MatIconModule,
    MatButtonModule,
    MatProgressSpinnerModule,
    MatTabsModule,
    MatTableModule,
    MatPaginatorModule,
    MaskedPhone,
    AccountStatusChip,
    AccountActions,
    AccountHistory,
  ],
  templateUrl: './sales-agent-detail.html',
  styleUrl: './sales-agent-detail.scss',
})
export class SalesAgentDetail {
  readonly agent = signal<SalesAgentDetailModel | null>(null);
  readonly loading = signal(true);
  readonly error = signal<string | null>(null);
  readonly historyRefresh = signal(0);

  readonly referralColumns = ['referred', 'type', 'accountStatus', 'referredAt', 'bonus'];
  readonly referrals = signal<ReferralRow[]>([]);
  readonly referralsLoading = signal(true);
  readonly referralsError = signal<string | null>(null);
  readonly referralPage = signal(0);
  readonly referralPageSize = signal(10);
  readonly referralTotal = signal(0);

  private readonly id: number;

  constructor(
    route: ActivatedRoute,
    private router: Router,
    private peopleDetailService: PeopleDetailService,
  ) {
    this.id = Number(route.snapshot.paramMap.get('id'));
    this.load();
    this.loadReferrals();
  }

  roleLabel(role: string | null): string {
    return role ? (ROLE_LABELS[role] ?? role) : '—';
  }

  /** Link to the referred account's own detail page, where one exists. */
  referredLink(row: ReferralRow): (string | number)[] | null {
    if (!row.referredUserId) return null;
    if (row.referredRole === 'MECHANIC') return ['/workshops/directory', row.referredUserId];
    if (row.referredRole === 'VEHICLE_USER') return ['/riders/directory', row.referredUserId];
    if (row.referredRole === 'SALES_REPRESENTATIVE') return ['/sales-agents/directory', row.referredUserId];
    return null;
  }

  backToDirectory(): void {
    this.router.navigate(['/sales-agents/directory']);
  }

  onAccountChanged(): void {
    this.historyRefresh.update((n) => n + 1);
    this.peopleDetailService.getSalesAgent(this.id).subscribe({
      next: (agent) => this.agent.set(agent),
      error: () => this.load(),
    });
  }

  onReferralPageChange(event: PageEvent): void {
    this.referralPage.set(event.pageIndex);
    this.referralPageSize.set(event.pageSize);
    this.loadReferrals();
  }

  private load(): void {
    this.loading.set(true);
    this.error.set(null);
    this.peopleDetailService.getSalesAgent(this.id).subscribe({
      next: (agent) => {
        this.agent.set(agent);
        this.loading.set(false);
      },
      error: (err) => {
        this.error.set(httpErrorMessage(err, 'Could not load this sales agent. They may not exist.'));
        this.loading.set(false);
      },
    });
  }

  private loadReferrals(): void {
    this.referralsLoading.set(true);
    this.referralsError.set(null);
    this.peopleDetailService.getReferrals(this.id, this.referralPage(), this.referralPageSize()).subscribe({
      next: (result) => {
        this.referrals.set(result.content);
        this.referralTotal.set(result.totalElements);
        this.referralsLoading.set(false);
      },
      error: (err) => {
        this.referralsError.set(httpErrorMessage(err, 'Could not load referred accounts.'));
        this.referralsLoading.set(false);
      },
    });
  }
}
