import { inject } from '@angular/core';
import { HttpInterceptorFn } from '@angular/common/http';
import { Router } from '@angular/router';
import { catchError, throwError } from 'rxjs';
import { AuthService } from '../services/auth.service';
import { ACCOUNT_SETTINGS_PATH } from '../guards/password-change.guard';

/**
 * Attaches the admin's JWT to every outgoing request. Logs out on a 401
 * (expired/invalid token, or the admin was disabled), and sends the admin to
 * Account Settings when the backend says they must replace a temporary password.
 */
export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const auth = inject(AuthService);
  const router = inject(Router);

  const token = auth.getToken();
  const authedReq = token ? req.clone({ setHeaders: { Authorization: `Bearer ${token}` } }) : req;

  return next(authedReq).pipe(
    catchError((error) => {
      if (error?.status === 401) {
        auth.logout();
        router.navigate(['/login']);
      } else if (error?.status === 403 && error?.error?.errorCode === 'PASSWORD_CHANGE_REQUIRED') {
        auth.requirePasswordChange();
        router.navigateByUrl(ACCOUNT_SETTINGS_PATH);
      }
      return throwError(() => error);
    }),
  );
};
