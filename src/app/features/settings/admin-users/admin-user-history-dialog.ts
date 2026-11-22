import { Component, Inject, signal } from '@angular/core';
import { DatePipe } from '@angular/common';
import { MatDialogModule, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { AdminUserService } from '../../../core/services/admin-user.service';
import { AdminUserAction, AdminUserHistoryEntry } from '../../../core/models/admin-user';
import { ADMIN_ROLE_LABELS, AdminRole } from '../../../core/models/admin-role';
import { httpErrorMessage } from '../../../core/utils/http-error-message';

export interface AdminUserHistoryDialogData {
  adminId: number;
  name: string;
}

interface ActionDisplay {
  label: string;
  icon: string;
  tone: 'positive' | 'warning' | 'neutral';
}

const ACTIONS: Record<AdminUserAction, ActionDisplay> = {
  ADMIN_CREATED: { label: 'Account created', icon: 'person_add', tone: 'positive' },
  ADMIN_ROLE_CHANGED: { label: 'Role changed', icon: 'manage_accounts', tone: 'neutral' },
  ADMIN_DISABLED: { label: 'Disabled', icon: 'block', tone: 'warning' },
  ADMIN_ENABLED: { label: 'Enabled', icon: 'restart_alt', tone: 'positive' },
  ADMIN_PASSWORD_RESET: { label: 'Password reset by a Super Admin', icon: 'lock_reset', tone: 'neutral' },
  PASSWORD_CHANGED: { label: 'Changed their own password', icon: 'key', tone: 'neutral' },
};

/** Newest-first audit trail for one admin user: creation, role and status changes, password resets. */
@Component({
  selector: 'app-admin-user-history-dialog',
  imports: [DatePipe, MatDialogModule, MatButtonModule, MatIconModule, MatProgressSpinnerModule, MatPaginatorModule],
  templateUrl: './admin-user-history-dialog.html',
  styleUrls: ['../../../shared/account-history/account-history.scss', './admin-user-history-dialog.scss'],
})
export class AdminUserHistoryDialog {
  readonly pageSize = 10;
  readonly entries = signal<AdminUserHistoryEntry[]>([]);
  readonly loading = signal(true);
  readonly error = signal<string | null>(null);
  readonly pageIndex = signal(0);
  readonly totalElements = signal(0);

  constructor(
    private adminUserService: AdminUserService,
    @Inject(MAT_DIALOG_DATA) public data: AdminUserHistoryDialogData,
  ) {
    this.load();
  }

  action(entry: AdminUserHistoryEntry): ActionDisplay {
    return ACTIONS[entry.action] ?? { label: entry.action, icon: 'history', tone: 'neutral' };
  }

  /** "Operations Admin → Finance Admin" for a role change; "as Finance Admin" for a new account. */
  change(entry: AdminUserHistoryEntry): string | null {
    const label = (value: string | null) => (value ? (ADMIN_ROLE_LABELS[value as AdminRole] ?? value) : '');
    if (entry.action === 'ADMIN_ROLE_CHANGED') {
      return `${label(entry.previousStatus)} → ${label(entry.newStatus)}`;
    }
    if (entry.action === 'ADMIN_CREATED' && entry.newStatus) {
      return `as ${label(entry.newStatus)}`;
    }
    return null;
  }

  onPageChange(event: PageEvent): void {
    this.pageIndex.set(event.pageIndex);
    this.load();
  }

  private load(): void {
    this.loading.set(true);
    this.error.set(null);
    this.adminUserService.getHistory(this.data.adminId, this.pageIndex(), this.pageSize).subscribe({
      next: (result) => {
        this.entries.set(result.content);
        this.totalElements.set(result.totalElements);
        this.loading.set(false);
      },
      error: (err) => {
        this.error.set(httpErrorMessage(err, 'Could not load the history.'));
        this.loading.set(false);
      },
    });
  }
}
