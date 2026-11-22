import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, map } from 'rxjs';
import { environment } from '../../../environments/environment';
import { ApiResponse } from '../models/api-response';
import { PagedResponse } from '../models/paged-response';
import { AdminRole } from '../models/admin-role';
import { AdminUser, AdminUserHistoryEntry, AdminUserQuery, TemporaryPassword } from '../models/admin-user';

/** Admin users and roles (ADMIN-US-29). Every endpoint is Super Admin only on the backend. */
@Injectable({ providedIn: 'root' })
export class AdminUserService {
  private readonly baseUrl = `${environment.apiUrl}/api/admin-users`;

  constructor(private http: HttpClient) {}

  list(query: AdminUserQuery): Observable<PagedResponse<AdminUser>> {
    let params = new HttpParams()
      .set('page', query.page)
      .set('size', query.size)
      .set('search', query.search)
      .set('sortBy', query.sortBy)
      .set('sortDir', query.sortDir);
    if (query.role) params = params.set('role', query.role);
    if (query.status) params = params.set('status', query.status);
    return this.http
      .get<ApiResponse<PagedResponse<AdminUser>>>(this.baseUrl, { params })
      .pipe(map((response) => response.data));
  }

  create(fullName: string, email: string, role: AdminRole, reason: string): Observable<TemporaryPassword> {
    return this.http
      .post<ApiResponse<TemporaryPassword>>(this.baseUrl, { fullName, email, role, reason })
      .pipe(map((response) => response.data));
  }

  changeRole(id: number, role: AdminRole, reason: string): Observable<AdminUser> {
    return this.http
      .post<ApiResponse<AdminUser>>(`${this.baseUrl}/${id}/role`, { role, reason })
      .pipe(map((response) => response.data));
  }

  setEnabled(id: number, enabled: boolean, reason: string): Observable<AdminUser> {
    return this.http
      .post<ApiResponse<AdminUser>>(`${this.baseUrl}/${id}/${enabled ? 'enable' : 'disable'}`, { reason })
      .pipe(map((response) => response.data));
  }

  resetPassword(id: number, reason: string): Observable<TemporaryPassword> {
    return this.http
      .post<ApiResponse<TemporaryPassword>>(`${this.baseUrl}/${id}/reset-password`, { reason })
      .pipe(map((response) => response.data));
  }

  getHistory(id: number, page: number, size: number): Observable<PagedResponse<AdminUserHistoryEntry>> {
    const params = new HttpParams().set('page', page).set('size', size);
    return this.http
      .get<ApiResponse<PagedResponse<AdminUserHistoryEntry>>>(`${this.baseUrl}/${id}/history`, { params })
      .pipe(map((response) => response.data));
  }
}
