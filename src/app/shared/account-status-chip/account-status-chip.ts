import { Component, input } from '@angular/core';
import { MatChipsModule } from '@angular/material/chips';
import { AccountStatus } from '../../core/models/account';

const LABELS: Record<AccountStatus, string> = {
  ACTIVE: 'Active',
  SUSPENDED: 'Suspended',
  DELETED: 'Deleted',
};

/** Active / Suspended / Deleted chip, using the global status-chip colors in styles.scss. */
@Component({
  selector: 'app-account-status-chip',
  imports: [MatChipsModule],
  template: `
    <mat-chip
      class="status-chip"
      [class.status-chip--approved]="status() === 'ACTIVE'"
      [class.status-chip--pending]="status() === 'SUSPENDED'"
      [class.status-chip--rejected]="status() === 'DELETED'"
    >
      {{ label() }}
    </mat-chip>
  `,
  styleUrl: './account-status-chip.scss',
})
export class AccountStatusChip {
  readonly status = input.required<AccountStatus>();

  label(): string {
    return LABELS[this.status()] ?? this.status();
  }
}
