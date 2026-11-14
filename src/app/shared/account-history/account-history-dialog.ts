import { Component, Inject } from '@angular/core';
import { MatDialogModule, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { AccountHistory } from './account-history';

export interface AccountHistoryDialogData {
  userId: number;
  name: string;
}

@Component({
  selector: 'app-account-history-dialog',
  imports: [MatDialogModule, MatButtonModule, AccountHistory],
  template: `
    <h2 mat-dialog-title>Account history: {{ data.name }}</h2>
    <mat-dialog-content class="history-dialog-content">
      <app-account-history [userId]="data.userId"></app-account-history>
    </mat-dialog-content>
    <mat-dialog-actions align="end">
      <button mat-button mat-dialog-close>Close</button>
    </mat-dialog-actions>
  `,
  styles: `
    .history-dialog-content {
      min-width: min(480px, 80vw);
    }
  `,
})
export class AccountHistoryDialog {
  constructor(@Inject(MAT_DIALOG_DATA) public data: AccountHistoryDialogData) {}
}
