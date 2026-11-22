import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, map } from 'rxjs';
import { environment } from '../../../environments/environment';
import { ApiResponse } from '../models/api-response';
import { PagedResponse } from '../models/paged-response';
import { AccountAction, AccountHistoryEntry, AccountStatus } from '../models/account';

/** Suspend / restore / delete for rider, workshop and sales agent accounts (Operations / Super Admin only). */
@Injectable({ providedIn: 'root' })
export class AccountService {
  private readonly baseUrl = `${environment.apiUrl}/api/accounts`;

  constructor(private http: HttpClient) {}

  /** Returns the account's new status. */
  apply(userId: number, action: AccountAction, reason: string): Observable<AccountStatus> {
    return this.http
      .post<ApiResponse<AccountStatus>>(`${this.baseUrl}/${userId}/${action}`, { reason })
      .pipe(map((response) => response.data));
  }

  getHistory(userId: number, page: number, size: number): Observable<PagedResponse<AccountHistoryEntry>> {
    const params = new HttpParams().set('page', page).set('size', size);
    return this.http
      .get<ApiResponse<PagedResponse<AccountHistoryEntry>>>(`${this.baseUrl}/${userId}/history`, { params })
      .pipe(map((response) => response.data));
  }
}
