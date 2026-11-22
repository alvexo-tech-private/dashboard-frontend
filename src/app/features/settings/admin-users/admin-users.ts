import { Component, signal } from '@angular/core';
import { DatePipe } from '@angular/common';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { Observable, Subject, debounceTime, distinctUntilChanged } from 'rxjs';
import { MatTableModule } from '@angular/material/table';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatButtonToggleModule } from '@angular/material/button-toggle';
import { MatChipsModule } from '@angular/material/chips';
import { MatMenuModule } from '@angular/material/menu';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { MatSortModule, Sort } from '@angular/material/sort';
import { MatDialog } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { AdminUserService } from '../../../core/services/admin-user.service';
import { AuthService } from '../../../core/services/auth.service';
import { AdminUser, AdminUserStatus, TemporaryPassword } from '../../../core/models/admin-user';
import { ADMIN_ROLE_LABELS, AdminRole } from '../../../core/models/admin-role';
import { apiErrorMessage, httpErrorMessage } from '../../../core/utils/http-error-message';
import {
  DecisionReasonDialog,
  DecisionReasonDialogData,
} from '../../../shared/decision-reason-dialog/decision-reason-dialog';
import { AdminUserFormDialog, AdminUserFormDialogData, AdminUserFormResult } from './admin-user-form-dialog';
import { TemporaryPasswordDialog, TemporaryPasswordDialogData } from './temporary-password-dialog';
import { AdminUserHistoryDialog, AdminUserHistoryDialogData } from './admin-user-history-dialog';

type StatusFilter = AdminUserStatus | 'ALL';

/**
 * Admin Users & Roles (ADMIN-US-29), Super Admin only. Add admins, change
 * their role, disable / enable access, reset passwords and view each admin's
 * audit trail. The backend enforces every rule (Super Admin only, no acting on
 * your own account, always one active Super Admin); this screen only offers
 * the actions that make sense for each row.
 */
@Component({
  selector: 'app-admin-users',
  imports: [
    DatePipe,
    MatTableModule,
    MatCardModule,
    MatIconModule,
    MatButtonModule,
    MatButtonToggleModule,
    MatChipsModule,
    MatMenuModule,
    MatTooltipModule,
    MatProgressSpinnerModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatPaginatorModule,
    MatSortModule,
  ],
  templateUrl: './admin-users.html',
  styleUrls: ['../../../shared/account-status-chip/account-status-chip.scss', './admin-users.scss'],
})
export class AdminUsers {
  readonly displayedColumns = ['fullName', 'role', 'status', 'lastLoginAt', 'createdAt', 'actions'];
  readonly pageSizeOptions = [10, 25, 50];
  readonly roles = Object.values(AdminRole);
  readonly roleLabels = ADMIN_ROLE_LABELS;
  readonly statusOptions: { value: StatusFilter; label: string }[] = [
    { value: 'ALL', label: 'All' },
    { value: 'ACTIVE', label: 'Active' },
    { value: 'DISABLED', label: 'Disabled' },
  ];

  readonly admins = signal<AdminUser[]>([]);
  readonly loading = signal(true);
  readonly error = signal<string | null>(null);
  readonly busyId = signal<number | null>(null);

  readonly pageIndex = signal(0);
  readonly pageSize = signal(10);
  readonly totalElements = signal(0);
  readonly searchTerm = signal('');
  readonly roleFilter = signal<AdminRole | null>(null);
  readonly statusFilter = signal<StatusFilter>('ALL');
  readonly sortActive = signal('fullName');
  readonly sortDirection = signal<'asc' | 'desc'>('asc');

  private readonly searchInput$ = new Subject<string>();

  constructor(
    private adminUserService: AdminUserService,
    protected auth: AuthService,
    private dialog: MatDialog,
    private snackBar: MatSnackBar,
  ) {
    this.searchInput$.pipe(debounceTime(300), distinctUntilChanged(), takeUntilDestroyed()).subscribe((term) => {
      this.searchTerm.set(term);
      this.pageIndex.set(0);
      this.load();
    });
    this.load();
  }

  roleLabel(role: AdminRole): string {
    return this.roleLabels[role] ?? role;
  }

  isSelf(admin: AdminUser): boolean {
    return admin.id === this.auth.currentAdminId();
  }

  onSearchInput(value: string): void {
    this.searchInput$.next(value);
  }

  onRoleFilterChange(role: AdminRole | null): void {
    this.roleFilter.set(role);
    this.pageIndex.set(0);
    this.load();
  }

  onStatusFilterChange(status: StatusFilter): void {
    this.statusFilter.set(status);
    this.pageIndex.set(0);
    this.load();
  }

  onPageChange(event: PageEvent): void {
    this.pageIndex.set(event.pageIndex);
    this.pageSize.set(event.pageSize);
    this.load();
  }

  onSortChange(sort: Sort): void {
    this.sortActive.set(sort.direction ? sort.active : 'fullName');
    this.sortDirection.set(sort.direction === 'desc' ? 'desc' : 'asc');
    this.pageIndex.set(0);
    this.load();
  }

  addAdmin(): void {
    this.dialog
      .open<AdminUserFormDialog, AdminUserFormDialogData, AdminUserFormResult>(AdminUserFormDialog, {
        data: { mode: 'create' },
      })
      .afterClosed()
      .subscribe((result) => {
        if (!result) return;
        this.run(
          null,
          this.adminUserService.create(result.fullName, result.email, result.role, result.reason),
          (issued) => this.showTemporaryPassword('Admin added', issued),
        );
      });
  }

  changeRole(admin: AdminUser): void {
    this.dialog
      .open<AdminUserFormDialog, AdminUserFormDialogData, AdminUserFormResult>(AdminUserFormDialog, {
        data: { mode: 'role', name: admin.fullName, currentRole: admin.role },
      })
      .afterClosed()
      .subscribe((result) => {
        if (!result) return;
        this.run(admin.id, this.adminUserService.changeRole(admin.id, result.role, result.reason), (updated) =>
          this.snackBar.open(`${admin.fullName} is now ${this.roleLabels[updated.role]}.`, 'OK', { duration: 4000 }),
        );
      });
  }

  setEnabled(admin: AdminUser, enabled: boolean): void {
    const data: DecisionReasonDialogData = enabled
      ? {
          title: `Enable ${admin.fullName}?`,
          message: `${admin.fullName} will be able to sign in to the Admin Portal again with their existing password.`,
          label: 'Reason',
          confirmText: 'Enable',
        }
      : {
          title: `Disable ${admin.fullName}?`,
          message:
            `${admin.fullName} is signed out straight away and can't sign in until an admin enables the account ` +
            `again. Their past actions stay in the audit trail.`,
          label: 'Reason',
          confirmText: 'Disable',
          destructive: true,
        };
    this.askReason(data, (reason) =>
      this.run(admin.id, this.adminUserService.setEnabled(admin.id, enabled, reason), () =>
        this.snackBar.open(`${admin.fullName} has been ${enabled ? 'enabled' : 'disabled'}.`, 'OK', {
          duration: 4000,
        }),
      ),
    );
  }

  resetPassword(admin: AdminUser): void {
    this.askReason(
      {
        title: `Reset password for ${admin.fullName}?`,
        message:
          'Their current password stops working straight away. You will get a temporary password to give them, ' +
          'and they must choose a new one when they next sign in.',
        label: 'Reason',
        confirmText: 'Reset password',
      },
      (reason) =>
        this.run(admin.id, this.adminUserService.resetPassword(admin.id, reason), (issued) =>
          this.showTemporaryPassword('Password reset', issued),
        ),
    );
  }

  openHistory(admin: AdminUser): void {
    this.dialog.open<AdminUserHistoryDialog, AdminUserHistoryDialogData>(AdminUserHistoryDialog, {
      data: { adminId: admin.id, name: admin.fullName },
    });
  }

  private askReason(data: DecisionReasonDialogData, then: (reason: string) => void): void {
    this.dialog
      .open<DecisionReasonDialog, DecisionReasonDialogData, string>(DecisionReasonDialog, { data })
      .afterClosed()
      .subscribe((reason) => {
        if (reason) then(reason);
      });
  }

  /** Runs one action, shows its error if it fails, and reloads the list either way so rows stay accurate. */
  private run<T>(adminId: number | null, action: Observable<T>, onSuccess: (result: T) => void): void {
    this.busyId.set(adminId ?? -1);
    action.subscribe({
      next: (result) => {
        this.busyId.set(null);
        onSuccess(result);
        this.load();
      },
      error: (err) => {
        this.busyId.set(null);
        this.snackBar.open(apiErrorMessage(err, 'Something went wrong. Please try again.'), 'Close', {
          duration: 8000,
        });
        this.load();
      },
    });
  }

  private showTemporaryPassword(title: string, issued: TemporaryPassword): void {
    this.dialog.open<TemporaryPasswordDialog, TemporaryPasswordDialogData>(TemporaryPasswordDialog, {
      data: {
        title,
        name: issued.adminUser.fullName,
        email: issued.adminUser.email,
        password: issued.temporaryPassword,
      },
      // Closing by accident would lose the only copy of the password.
      disableClose: true,
    });
  }

  private load(): void {
    this.loading.set(true);
    this.error.set(null);
    const status = this.statusFilter();
    this.adminUserService
      .list({
        page: this.pageIndex(),
        size: this.pageSize(),
        search: this.searchTerm(),
        role: this.roleFilter(),
        status: status === 'ALL' ? null : status,
        sortBy: this.sortActive(),
        sortDir: this.sortDirection(),
      })
      .subscribe({
        next: (result) => {
          this.admins.set(result.content);
          this.totalElements.set(result.totalElements);
          this.loading.set(false);
        },
        error: (err) => {
          this.error.set(httpErrorMessage(err, 'Could not load admin users.'));
          this.loading.set(false);
        },
      });
  }
}
