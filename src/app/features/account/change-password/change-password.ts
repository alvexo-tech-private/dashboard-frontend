import { Component, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatTooltipModule } from '@angular/material/tooltip';
import { AuthService } from '../../../core/services/auth.service';
import { httpErrorMessage } from '../../../core/utils/http-error-message';

@Component({
  selector: 'app-change-password',
  imports: [
    FormsModule,
    MatCardModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatIconModule,
    MatProgressSpinnerModule,
    MatTooltipModule,
  ],
  templateUrl: './change-password.html',
  styleUrl: './change-password.scss',
})
export class ChangePassword {
  readonly currentPassword = signal('');
  readonly newPassword = signal('');
  readonly confirmPassword = signal('');

  readonly currentPasswordVisible = signal(false);
  readonly newPasswordVisible = signal(false);

  readonly loading = signal(false);
  readonly error = signal<string | null>(null);
  readonly success = signal(false);

  constructor(private auth: AuthService) {}

  toggleCurrentPasswordVisibility(): void {
    this.currentPasswordVisible.update((visible) => !visible);
  }

  toggleNewPasswordVisibility(): void {
    this.newPasswordVisible.update((visible) => !visible);
  }

  get mismatched(): boolean {
    return this.confirmPassword().length > 0 && this.newPassword() !== this.confirmPassword();
  }

  submit(): void {
    if (!this.currentPassword() || this.newPassword().length < 8 || this.mismatched) return;

    this.loading.set(true);
    this.error.set(null);
    this.success.set(false);
    this.auth.changePassword(this.currentPassword(), this.newPassword()).subscribe({
      next: () => {
        this.loading.set(false);
        this.success.set(true);
        this.currentPassword.set('');
        this.newPassword.set('');
        this.confirmPassword.set('');
      },
      error: (err) => {
        this.loading.set(false);
        this.error.set(httpErrorMessage(err, 'Current password is incorrect.'));
      },
    });
  }
}
