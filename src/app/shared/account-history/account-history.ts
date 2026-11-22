import { Component, effect, input, signal, untracked } from '@angular/core';
import { DatePipe } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { AccountService } from '../../core/services/account.service';
import { AccountHistoryEntry } from '../../core/models/account';
import { httpErrorMessage } from '../../core/utils/http-error-message';

const ACTION_LABELS: Record<AccountHistoryEntry['action'], { label: string; icon: string }> = {
  ACCOUNT_SUSPENDED: { label: 'Suspended', icon: 'block' },
  ACCOUNT_RESTORED: { label: 'Restored', icon: 'restart_alt' },
  ACCOUNT_DELETED: { label: 'Deleted', icon: 'delete' },
};

/**
 * Read-only, newest-first timeline of the suspend / restore / delete actions
 * taken on one account (from the audit log). Reload by changing `refreshKey`.
 */
@Component({
  selector: 'app-account-history',
  imports: [DatePipe, MatIconModule, MatProgressSpinnerModule, MatPaginatorModule],
  templateUrl: './account-history.html',
  styleUrl: './account-history.scss',
})
export class AccountHistory {
  readonly userId = input.required<number>();
  readonly refreshKey = input(0);

  readonly entries = signal<AccountHistoryEntry[]>([]);
  readonly loading = signal(true);
  readonly error = signal<string | null>(null);
  readonly pageIndex = signal(0);
  readonly pageSize = signal(5);
  readonly totalElements = signal(0);

  constructor(private accountService: AccountService) {
    // Only userId / refreshKey should re-trigger this. Without untracked(),
    // load() reading pageIndex made every page change re-run the effect and
    // snap back to page 0.
    effect(() => {
      this.refreshKey();
      const userId = this.userId();
      untracked(() => {
        this.pageIndex.set(0);
        this.load(userId);
      });
    });
  }

  actionLabel(entry: AccountHistoryEntry): { label: string; icon: string } {
    return ACTION_LABELS[entry.action] ?? { label: entry.action, icon: 'history' };
  }

  onPageChange(event: PageEvent): void {
    this.pageIndex.set(event.pageIndex);
    this.pageSize.set(event.pageSize);
    this.load(this.userId());
  }

  private load(userId: number): void {
    this.loading.set(true);
    this.error.set(null);
    this.accountService.getHistory(userId, this.pageIndex(), this.pageSize()).subscribe({
      next: (result) => {
        this.entries.set(result.content);
        this.totalElements.set(result.totalElements);
        this.loading.set(false);
      },
      error: (err) => {
        this.error.set(httpErrorMessage(err, 'Could not load the account history.'));
        this.loading.set(false);
      },
    });
  }
}
