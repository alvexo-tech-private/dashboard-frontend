import { Component, input, output, signal } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatMenuModule } from '@angular/material/menu';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatDialog } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { AccountService } from '../../core/services/account.service';
import { AccountAction, AccountKind, AccountStatus } from '../../core/models/account';
import { apiErrorMessage } from '../../core/utils/http-error-message';
import { DecisionReasonDialog, DecisionReasonDialogData } from '../decision-reason-dialog/decision-reason-dialog';
import { AccountHistoryDialog, AccountHistoryDialogData } from '../account-history/account-history-dialog';

/**
 * "⋮" menu with Suspend / Restore / Delete / View history for one rider,
 * workshop or sales agent account. Every action asks for a reason first;
 * the backend enforces the same rules (and the Operations / Super Admin
 * restriction), so this only offers the actions valid for the current status.
 *
 * Emits `changed` with the new status after a successful action so the
 * host screen can update its row or reload.
 */
@Component({
  selector: 'app-account-actions',
  imports: [MatButtonModule, MatIconModule, MatMenuModule, MatTooltipModule],
  template: `
    <button
      mat-icon-button
      [matMenuTriggerFor]="menu"
      [disabled]="busy()"
      matTooltip="Account actions"
      [attr.aria-label]="'Account actions for ' + name()"
      (click)="$event.stopPropagation()"
    >
      <mat-icon>more_vert</mat-icon>
    </button>
    <mat-menu #menu="matMenu">
      @if (status() === 'ACTIVE') {
        <button mat-menu-item (click)="run('suspend')">
          <mat-icon>block</mat-icon>
          <span>Suspend</span>
        </button>
      }
      @if (status() === 'SUSPENDED') {
        <button mat-menu-item (click)="run('restore')">
          <mat-icon>restart_alt</mat-icon>
          <span>Restore</span>
        </button>
      }
      @if (status() !== 'DELETED') {
        <button mat-menu-item class="danger-item" (click)="run('delete')">
          <mat-icon>delete</mat-icon>
          <span>Delete</span>
        </button>
      }
      <button mat-menu-item (click)="openHistory()">
        <mat-icon>history</mat-icon>
        <span>View history</span>
      </button>
    </mat-menu>
  `,
  styles: `
    .danger-item,
    .danger-item mat-icon {
      color: var(--mat-sys-error);
    }
  `,
})
export class AccountActions {
  readonly userId = input.required<number>();
  readonly status = input.required<AccountStatus>();
  readonly name = input.required<string>();
  readonly kind = input.required<AccountKind>();

  readonly changed = output<AccountStatus>();
  readonly busy = signal(false);

  constructor(
    private dialog: MatDialog,
    private snackBar: MatSnackBar,
    private accountService: AccountService,
  ) {}

  run(action: AccountAction): void {
    this.dialog
      .open<DecisionReasonDialog, DecisionReasonDialogData, string>(DecisionReasonDialog, {
        data: this.dialogData(action),
      })
      .afterClosed()
      .subscribe((reason) => {
        if (!reason) return;
        this.busy.set(true);
        this.accountService.apply(this.userId(), action, reason).subscribe({
          next: (newStatus) => {
            this.busy.set(false);
            this.snackBar.open(this.successMessage(action), 'OK', { duration: 4000 });
            this.changed.emit(newStatus);
          },
          error: (err) => {
            this.busy.set(false);
            this.snackBar.open(apiErrorMessage(err, 'Something went wrong. Please try again.'), 'Close', {
              duration: 8000,
            });
          },
        });
      });
  }

  openHistory(): void {
    this.dialog.open<AccountHistoryDialog, AccountHistoryDialogData>(AccountHistoryDialog, {
      data: { userId: this.userId(), name: this.name() },
    });
  }

  private dialogData(action: AccountAction): DecisionReasonDialogData {
    const name = this.name();
    const kind = this.kind();
    switch (action) {
      case 'suspend':
        return {
          title: `Suspend ${name}?`,
          message:
            `This ${kind} will be signed out of the app straight away and won't be able to sign in until ` +
            `the account is restored.` +
            (kind === 'workshop' ? ' The workshop will stop appearing to riders.' : '') +
            ' Existing bookings are not cancelled.',
          label: 'Reason (the user will see this)',
          confirmText: 'Suspend',
        };
      case 'restore':
        return {
          title: `Restore ${name}?`,
          message: `This ${kind} will be able to sign in and use the app again. Nothing else about the account changes.`,
          label: 'Reason',
          confirmText: 'Restore',
        };
      case 'delete':
        return {
          title: `Delete ${name}?`,
          message:
            `This closes the ${kind}'s account for good. It can't be restored afterwards. ` +
            `Their booking and payment history is kept. Accounts with open bookings or unpaid settlements can't be deleted. ` +
            `If you might need to undo this, suspend the account instead.`,
          label: 'Reason (the user will see this)',
          confirmText: 'Delete account',
          destructive: true,
        };
    }
  }

  private successMessage(action: AccountAction): string {
    const name = this.name();
    switch (action) {
      case 'suspend':
        return `${name} has been suspended.`;
      case 'restore':
        return `${name} has been restored.`;
      case 'delete':
        return `${name} has been deleted.`;
    }
  }
}
