import { inject } from '@angular/core';
import { CanActivateChildFn, Router } from '@angular/router';
import { AuthService } from '../services/auth.service';

export const ACCOUNT_SETTINGS_PATH = '/account/settings';

/**
 * Keeps an admin who is still on a temporary password on Account Settings
 * until they choose their own. UX only: the backend refuses every other
 * call with PASSWORD_CHANGE_REQUIRED anyway.
 */
export const passwordChangeGuard: CanActivateChildFn = (_route, state) => {
  const auth = inject(AuthService);
  if (!auth.mustChangePassword() || state.url.startsWith(ACCOUNT_SETTINGS_PATH)) {
    return true;
  }
  return inject(Router).parseUrl(ACCOUNT_SETTINGS_PATH);
};
