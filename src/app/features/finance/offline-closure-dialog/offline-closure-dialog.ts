import { Component, inject } from '@angular/core';
import { CurrencyPipe } from '@angular/common';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatSelectModule } from '@angular/material/select';
import { OfflineClosureRequest, SettlementBatchRow } from '../../../core/models/finance';

/** Super Admin offline closure of a batch paid outside the gateway — UTR and comment are mandatory. */
@Component({
  selector: 'app-offline-closure-dialog',
  imports: [MatDialogModule, MatFormFieldModule, MatInputModule, MatButtonModule, MatSelectModule,
    ReactiveFormsModule, CurrencyPipe],
  template: `
    <h2 mat-dialog-title>Offline closure</h2>
    <mat-dialog-content>
      <p class="intro">
        Close <strong>{{ batch.batchReference }}</strong> ({{ batch.workshopName }}) for
        <strong>{{ batch.netSettlement | currency: 'INR' : 'symbol' : '1.2-2' }}</strong> as paid outside the payment
        gateway. Its bookings become Paid in the workshop app and the action is recorded in the audit trail.
      </p>
      <form [formGroup]="form" class="form">
        <mat-form-field appearance="outline">
          <mat-label>Bank UTR / transfer reference</mat-label>
          <input matInput formControlName="utr" maxlength="100" />
        </mat-form-field>
        <mat-form-field appearance="outline">
          <mat-label>Payment mode</mat-label>
          <mat-select formControlName="paymentMode">
            <mat-option value="BANK_TRANSFER">Bank transfer (NEFT/IMPS/RTGS)</mat-option>
            <mat-option value="UPI">UPI</mat-option>
          </mat-select>
        </mat-form-field>
        <mat-form-field appearance="outline">
          <mat-label>Comment (required)</mat-label>
          <textarea matInput formControlName="comment" rows="3" maxlength="500"></textarea>
        </mat-form-field>
      </form>
    </mat-dialog-content>
    <mat-dialog-actions align="end">
      <button mat-button mat-dialog-close>Cancel</button>
      <button mat-flat-button [disabled]="form.invalid" (click)="submit()">Close as paid</button>
    </mat-dialog-actions>
  `,
  styles: [`.intro { margin: 0 0 16px; font-size: 0.9rem; } .form { display: flex; flex-direction: column; min-width: 360px; }`],
})
export class OfflineClosureDialog {
  private readonly ref = inject(MatDialogRef<OfflineClosureDialog, OfflineClosureRequest>);
  readonly batch: SettlementBatchRow = inject(MAT_DIALOG_DATA);

  readonly form = new FormGroup({
    utr: new FormControl('', { nonNullable: true, validators: [Validators.required, Validators.pattern(/\S/)] }),
    paymentMode: new FormControl('BANK_TRANSFER', { nonNullable: true }),
    comment: new FormControl('', { nonNullable: true, validators: [Validators.required, Validators.pattern(/\S/)] }),
  });

  submit(): void {
    if (this.form.invalid) return;
    const v = this.form.getRawValue();
    this.ref.close({ utr: v.utr.trim(), comment: v.comment.trim(), paymentMode: v.paymentMode });
  }
}
