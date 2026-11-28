import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, map } from 'rxjs';
import { environment } from '../../../environments/environment';
import { ApiResponse } from '../models/api-response';
import {
  BookingFinance,
  FinanceDashboard,
  FinanceOverview,
  TransactionPage,
  OfflineClosureRequest,
  SettlementBatchDetail,
  SettlementBatchRow,
} from '../models/finance';

const BASE_URL = `${environment.apiUrl}/api/finance`;

/** Transaction filters (all optional, combinable). paymentDate = YYYY-MM-DD, that day only. */
export interface TransactionFilters {
  bookingId?: string;
  customer?: string;
  /** Workshop name or ID (WS-3). */
  workshop?: string;
  paymentDate?: string;
  status?: string | null;
}

/** Finance module (ADMIN-EPIC-06): read-only finance data + the Super Admin offline closure. */
@Injectable({ providedIn: 'root' })
export class FinanceService {
  constructor(private http: HttpClient) {}

  getOverview(from: string, to: string): Observable<FinanceOverview> {
    return this.http
      .get<ApiResponse<FinanceOverview>>(`${BASE_URL}/overview`, { params: { from, to } })
      .pipe(map((r) => r.data));
  }

  getTransactions(from: string, to: string, filters: TransactionFilters, page: number, size: number):
      Observable<TransactionPage> {
    let params = new HttpParams().set('from', from).set('to', to).set('page', page).set('size', size);
    if (filters.bookingId?.trim()) params = params.set('bookingId', filters.bookingId.trim());
    if (filters.customer?.trim()) params = params.set('customer', filters.customer.trim());
    if (filters.workshop?.trim()) params = params.set('workshop', filters.workshop.trim());
    if (filters.paymentDate) params = params.set('paymentDate', filters.paymentDate);
    if (filters.status) params = params.set('status', filters.status);
    return this.http
      .get<ApiResponse<TransactionPage>>(`${BASE_URL}/transactions`, { params })
      .pipe(map((r) => r.data));
  }

  getDashboard(date: string): Observable<FinanceDashboard> {
    return this.http
      .get<ApiResponse<FinanceDashboard>>(`${BASE_URL}/dashboard`, { params: { date } })
      .pipe(map((r) => r.data));
  }

  getSettlements(date: string, status: string | null, search: string): Observable<SettlementBatchRow[]> {
    let params = new HttpParams().set('date', date);
    if (status) params = params.set('status', status);
    if (search.trim()) params = params.set('search', search.trim());
    return this.http
      .get<ApiResponse<SettlementBatchRow[]>>(`${BASE_URL}/settlements`, { params })
      .pipe(map((r) => r.data));
  }

  getSettlement(batchReference: string): Observable<SettlementBatchDetail> {
    return this.http
      .get<ApiResponse<SettlementBatchDetail>>(`${BASE_URL}/settlements/${encodeURIComponent(batchReference)}`)
      .pipe(map((r) => r.data));
  }

  getBooking(bookingRef: string): Observable<BookingFinance> {
    return this.http
      .get<ApiResponse<BookingFinance>>(`${BASE_URL}/bookings/${encodeURIComponent(bookingRef.trim())}`)
      .pipe(map((r) => r.data));
  }

  closeOffline(batchReference: string, request: OfflineClosureRequest): Observable<SettlementBatchDetail> {
    return this.http
      .post<ApiResponse<SettlementBatchDetail>>(
        `${BASE_URL}/settlements/${encodeURIComponent(batchReference)}/offline-closure`,
        request,
      )
      .pipe(map((r) => r.data));
  }
}
