import { Component, signal } from '@angular/core';
import { CurrencyPipe, DatePipe } from '@angular/common';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { Subject, debounceTime, distinctUntilChanged } from 'rxjs';
import { MatTableModule } from '@angular/material/table';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { MatSortModule, Sort } from '@angular/material/sort';
import { SalesAgentService } from '../../../core/services/sales-agent.service';
import { SalesAgent } from '../../../core/models/sales-agent';
import { MaskedPhone } from '../../../shared/masked-phone/masked-phone';
import { httpErrorMessage } from '../../../core/utils/http-error-message';
import { AccountStatusFilter as StatusFilter } from '../../../core/models/account';
import { AccountStatusChip } from '../../../shared/account-status-chip/account-status-chip';
import { AccountStatusFilter } from '../../../shared/account-status-filter/account-status-filter';
import { AccountActions } from '../../../shared/account-actions/account-actions';

@Component({
  selector: 'app-sales-agent-directory',
  imports: [
    DatePipe,
    CurrencyPipe,
    MatTableModule,
    MatCardModule,
    MatIconModule,
    MatProgressSpinnerModule,
    MatFormFieldModule,
    MatInputModule,
    MatPaginatorModule,
    MatSortModule,
    AccountStatusChip,
    AccountStatusFilter,
    AccountActions,
    MaskedPhone,
  ],
  templateUrl: './sales-agent-directory.html',
  styleUrl: './sales-agent-directory.scss',
})
export class SalesAgentDirectory {
  readonly displayedColumns = [
    'name',
    'contact',
    'city',
    'referralCode',
    'referrals',
    'accountStatus',
    'createdAt',
    'actions',
  ];

  readonly pageSizeOptions = [5, 10, 25, 50];

  readonly agents = signal<SalesAgent[]>([]);
  readonly loading = signal(true);
  readonly error = signal<string | null>(null);

  readonly pageIndex = signal(0);
  readonly pageSize = signal(10);
  readonly totalElements = signal(0);
  readonly searchTerm = signal('');
  readonly sortActive = signal('id');
  readonly sortDirection = signal<'asc' | 'desc'>('asc');
  readonly statusFilter = signal<StatusFilter>('ALL');

  private readonly searchInput$ = new Subject<string>();

  constructor(private salesAgentService: SalesAgentService) {
    this.searchInput$
      .pipe(debounceTime(300), distinctUntilChanged(), takeUntilDestroyed())
      .subscribe((term) => {
        this.searchTerm.set(term);
        this.pageIndex.set(0);
        this.load();
      });
    this.load();
  }

  onSearchInput(value: string): void {
    this.searchInput$.next(value);
  }

  onStatusFilterChange(status: StatusFilter): void {
    this.statusFilter.set(status);
    this.pageIndex.set(0);
    this.load();
  }

  /** After a suspend / restore / delete, reload so the row (and the active filter) stay accurate. */
  onAccountChanged(): void {
    this.load();
  }

  onPageChange(event: PageEvent): void {
    this.pageIndex.set(event.pageIndex);
    this.pageSize.set(event.pageSize);
    this.load();
  }

  onSortChange(sort: Sort): void {
    this.sortActive.set(sort.direction ? sort.active : 'id');
    this.sortDirection.set(sort.direction === 'desc' ? 'desc' : 'asc');
    this.pageIndex.set(0);
    this.load();
  }

  private load(): void {
    this.loading.set(true);
    this.error.set(null);
    this.salesAgentService
      .getSalesAgents({
        page: this.pageIndex(),
        size: this.pageSize(),
        search: this.searchTerm(),
        sortBy: this.sortActive(),
        sortDir: this.sortDirection(),
        status: this.statusFilter(),
      })
      .subscribe({
        next: (result) => {
          this.agents.set(result.content);
          this.totalElements.set(result.totalElements);
          this.loading.set(false);
        },
        error: (err) => {
          this.error.set(httpErrorMessage(err, 'Could not load sales agents.'));
          this.loading.set(false);
        },
      });
  }
}
