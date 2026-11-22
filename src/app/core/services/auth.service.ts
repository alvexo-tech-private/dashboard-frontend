import { Injectable, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, map, tap } from 'rxjs';
import { environment } from '../../../environments/environment';
import { ApiResponse } from '../models/api-response';
import { AdminUserSummary, LoginResponse } from '../models/login-response';
import { AdminRole } from '../models/admin-role';

const TOKEN_STORAGE_KEY = 'admin_access_token';
const MUST_CHANGE_PASSWORD_KEY = 'admin_must_change_password';

interface AccessTokenClaims {
  sub: string;
  email: string;
  fullName: string;
  role: AdminRole;
  exp: number;
}

@Injectable({ providedIn: 'root' })
export class AuthService {
  readonly isAuthenticated = signal(false);
  readonly currentRole = signal<AdminRole | null>(null);
  readonly adminName = signal<string | null>(null);
  readonly currentAdminId = signal<number | null>(null);
  /**
   * True while the admin is on a temporary password. The route guard keeps
   * them on Account Settings and the backend refuses other calls until it
   * is changed.
   */
  readonly mustChangePassword = signal(false);

  constructor(private http: HttpClient) {
    this.restoreSession();
  }

  login(email: string, password: string): Observable<void> {
    return this.http
      .post<ApiResponse<LoginResponse>>(`${environment.apiUrl}/api/auth/login`, { email, password })
      .pipe(
        tap((response) => {
          this.applySession(response.data.accessToken);
          this.applyProfile(response.data.adminUser);
        }),
        map(() => void 0),
      );
  }

  /**
   * Re-reads the signed-in admin's profile, so a role change or name change a
   * Super Admin made since sign-in shows up without signing in again. The
   * backend already uses the current role on every request; this keeps the
   * menus in step with it.
   */
  refreshProfile(): Observable<void> {
    return this.http.get<ApiResponse<AdminUserSummary>>(`${environment.apiUrl}/api/auth/me`).pipe(
      tap((response) => this.applyProfile(response.data)),
      map(() => void 0),
    );
  }

  changePassword(currentPassword: string, newPassword: string): Observable<void> {
    return this.http
      .post<ApiResponse<void>>(`${environment.apiUrl}/api/auth/change-password`, { currentPassword, newPassword })
      .pipe(
        tap(() => this.setMustChangePassword(false)),
        map(() => void 0),
      );
  }

  /** Called when the backend answers PASSWORD_CHANGE_REQUIRED. */
  requirePasswordChange(): void {
    this.setMustChangePassword(true);
  }

  logout(): void {
    localStorage.removeItem(TOKEN_STORAGE_KEY);
    localStorage.removeItem(MUST_CHANGE_PASSWORD_KEY);
    this.adminName.set(null);
    this.currentRole.set(null);
    this.currentAdminId.set(null);
    this.mustChangePassword.set(false);
    this.isAuthenticated.set(false);
  }

  getToken(): string | null {
    return localStorage.getItem(TOKEN_STORAGE_KEY);
  }

  private restoreSession(): void {
    const token = this.getToken();
    if (!token) return;

    const claims = this.decodeClaims(token);
    if (!claims || claims.exp * 1000 <= Date.now()) {
      localStorage.removeItem(TOKEN_STORAGE_KEY);
      localStorage.removeItem(MUST_CHANGE_PASSWORD_KEY);
      return;
    }

    this.currentAdminId.set(Number(claims.sub));
    this.adminName.set(claims.fullName);
    this.currentRole.set(claims.role);
    this.mustChangePassword.set(localStorage.getItem(MUST_CHANGE_PASSWORD_KEY) === 'true');
    this.isAuthenticated.set(true);
  }

  private applySession(token: string): void {
    localStorage.setItem(TOKEN_STORAGE_KEY, token);
    const claims = this.decodeClaims(token);
    if (!claims) return;

    this.currentAdminId.set(Number(claims.sub));
    this.adminName.set(claims.fullName);
    this.currentRole.set(claims.role);
    this.isAuthenticated.set(true);
  }

  private applyProfile(profile: AdminUserSummary): void {
    this.currentAdminId.set(profile.id);
    this.adminName.set(profile.fullName);
    this.currentRole.set(profile.role);
    this.setMustChangePassword(profile.mustChangePassword);
  }

  private setMustChangePassword(value: boolean): void {
    this.mustChangePassword.set(value);
    if (value) {
      localStorage.setItem(MUST_CHANGE_PASSWORD_KEY, 'true');
    } else {
      localStorage.removeItem(MUST_CHANGE_PASSWORD_KEY);
    }
  }

  private decodeClaims(token: string): AccessTokenClaims | null {
    try {
      const payload = token.split('.')[1];
      const base64 = payload.replace(/-/g, '+').replace(/_/g, '/');
      return JSON.parse(atob(base64)) as AccessTokenClaims;
    } catch {
      return null;
    }
  }
}
