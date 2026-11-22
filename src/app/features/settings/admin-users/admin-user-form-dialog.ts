import { Component, Inject, computed, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatDialogModule, MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { ADMIN_ROLE_LABELS, AdminRole } from '../../../core/models/admin-role';

/** What each role can do, in plain words, shown under the role picker. */
export const ADMIN_ROLE_DESCRIPTIONS: Record<AdminRole, string> = {
  [AdminRole.SUPER_ADMIN]:
    'Full access, including managing admin users, platform settings and Super-Admin-only finance actions.',
  [AdminRole.FINANCE_ADMIN]:
    'Finance dashboard, settlements, settlement exceptions, commission payouts and finance reports.',
  [AdminRole.OPERATIONS_ADMIN]:
    'Riders, workshops and sales agents: directories, registration and verification queues, suspend / restore / delete.',
};

export type AdminUserFormDialogData =
  | { mode: 'create' }
  | { mode: 'role'; name: string; currentRole: AdminRole };

export interface AdminUserFormResult {
  fullName: string;
  email: string;
  role: AdminRole;
  reason: string;
}

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/** "Add admin" (name, email, role, optional note) or "Change role" (role, required reason). */
@Component({
  selector: 'app-admin-user-form-dialog',
  imports: [FormsModule, MatDialogModule, MatButtonModule, MatFormFieldModule, MatInputModule, MatSelectModule],
  templateUrl: './admin-user-form-dialog.html',
  styleUrl: './admin-user-dialogs.scss',
})
export class AdminUserFormDialog {
  readonly roles = Object.values(AdminRole);
  readonly roleLabels = ADMIN_ROLE_LABELS;
  readonly roleDescriptions = ADMIN_ROLE_DESCRIPTIONS;

  readonly fullName = signal('');
  readonly email = signal('');
  readonly role = signal<AdminRole | null>(null);
  readonly reason = signal('');

  readonly emailValid = computed(() => EMAIL_PATTERN.test(this.email().trim()));

  readonly valid = computed(() => {
    const role = this.role();
    if (!role) return false;
    if (this.data.mode === 'create') {
      return this.fullName().trim().length > 0 && this.emailValid();
    }
    return role !== this.data.currentRole && this.reason().trim().length > 0;
  });

  constructor(
    private dialogRef: MatDialogRef<AdminUserFormDialog, AdminUserFormResult>,
    @Inject(MAT_DIALOG_DATA) public data: AdminUserFormDialogData,
  ) {
    if (data.mode === 'role') {
      this.role.set(data.currentRole);
    }
  }

  get title(): string {
    return this.data.mode === 'create' ? 'Add admin' : `Change role: ${this.data.name}`;
  }

  confirm(): void {
    if (!this.valid()) return;
    this.dialogRef.close({
      fullName: this.fullName().trim(),
      email: this.email().trim(),
      role: this.role()!,
      reason: this.reason().trim(),
    });
  }

  cancel(): void {
    this.dialogRef.close(undefined);
  }
}
