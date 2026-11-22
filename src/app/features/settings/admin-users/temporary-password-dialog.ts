import { Component, Inject, signal } from '@angular/core';
import { Clipboard } from '@angular/cdk/clipboard';
import { MatDialogModule, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';

export interface TemporaryPasswordDialogData {
  title: string;
  name: string;
  email: string;
  password: string;
}

/**
 * Shows a newly issued temporary password once. It isn't stored in plain
 * text anywhere, so closing this dialog is the last chance to copy it.
 */
@Component({
  selector: 'app-temporary-password-dialog',
  imports: [MatDialogModule, MatButtonModule, MatIconModule, MatTooltipModule],
  template: `
    <h2 mat-dialog-title>{{ data.title }}</h2>
    <mat-dialog-content class="dialog-content">
      <p class="dialog-message">
        Give these sign-in details to <strong>{{ data.name }}</strong> in person or over a trusted channel. They will
        be asked to choose their own password when they first sign in.
      </p>
      <dl class="credentials">
        <dt>Email</dt>
        <dd>{{ data.email }}</dd>
        <dt>Temporary password</dt>
        <dd class="password-row">
          <code class="password">{{ data.password }}</code>
          <button
            mat-icon-button
            [matTooltip]="copied() ? 'Copied' : 'Copy password'"
            aria-label="Copy temporary password"
            (click)="copy()"
          >
            <mat-icon>{{ copied() ? 'check' : 'content_copy' }}</mat-icon>
          </button>
        </dd>
      </dl>
      <p class="warning">
        <mat-icon>warning_amber</mat-icon>
        <span>This password is shown only once. If it is lost, reset the password again.</span>
      </p>
    </mat-dialog-content>
    <mat-dialog-actions align="end">
      <button mat-flat-button mat-dialog-close>Done</button>
    </mat-dialog-actions>
  `,
  styleUrl: './admin-user-dialogs.scss',
})
export class TemporaryPasswordDialog {
  readonly copied = signal(false);

  constructor(
    private clipboard: Clipboard,
    @Inject(MAT_DIALOG_DATA) public data: TemporaryPasswordDialogData,
  ) {}

  copy(): void {
    this.copied.set(this.clipboard.copy(this.data.password));
  }
}
