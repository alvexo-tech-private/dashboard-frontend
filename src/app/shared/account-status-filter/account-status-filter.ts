import { Component, input, output } from '@angular/core';
import { MatButtonToggleModule } from '@angular/material/button-toggle';
import { AccountStatusFilter as Filter } from '../../core/models/account';

/** All / Active / Suspended / Deleted toggle shown above each people directory. */
@Component({
  selector: 'app-account-status-filter',
  imports: [MatButtonToggleModule],
  template: `
    <mat-button-toggle-group
      hideSingleSelectionIndicator
      aria-label="Filter by account status"
      [value]="value()"
      (change)="changed.emit($event.value)"
    >
      @for (option of options; track option.value) {
        <mat-button-toggle [value]="option.value">{{ option.label }}</mat-button-toggle>
      }
    </mat-button-toggle-group>
  `,
})
export class AccountStatusFilter {
  readonly value = input<Filter>('ALL');
  readonly changed = output<Filter>();

  readonly options: { value: Filter; label: string }[] = [
    { value: 'ALL', label: 'All' },
    { value: 'ACTIVE', label: 'Active' },
    { value: 'SUSPENDED', label: 'Suspended' },
    { value: 'DELETED', label: 'Deleted' },
  ];
}
