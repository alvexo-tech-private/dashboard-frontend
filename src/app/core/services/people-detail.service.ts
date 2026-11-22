import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, map } from 'rxjs';
import { environment } from '../../../environments/environment';
import { ApiResponse } from '../models/api-response';
import { PagedResponse } from '../models/paged-response';
import {
  BookingRow,
  BookingStatus,
  ReferralRow,
  ReviewRow,
  RiderDetail,
  SalesAgentDetail,
} from '../models/people-detail';

/** Read-only detail data behind the rider, workshop and sales agent pages. */
@Injectable({ providedIn: 'root' })
export class PeopleDetailService {
  private readonly baseUrl = `${environment.apiUrl}/api/users`;

  constructor(private http: HttpClient) {}

  getRider(id: number): Observable<RiderDetail> {
    return this.get<RiderDetail>(`${this.baseUrl}/vehicle-users/${id}`);
  }

  getSalesAgent(id: number): Observable<SalesAgentDetail> {
    return this.get<SalesAgentDetail>(`${this.baseUrl}/sales-agents/${id}`);
  }

  getReferrals(salesAgentId: number, page: number, size: number): Observable<PagedResponse<ReferralRow>> {
    return this.get<PagedResponse<ReferralRow>>(`${this.baseUrl}/sales-agents/${salesAgentId}/referrals`, {
      page,
      size,
    });
  }

  /** Bookings of a rider or a workshop. */
  getBookings(
    userId: number,
    page: number,
    size: number,
    status: BookingStatus | 'ALL',
  ): Observable<PagedResponse<BookingRow>> {
    return this.get<PagedResponse<BookingRow>>(`${this.baseUrl}/${userId}/bookings`, { page, size, status });
  }

  /** Reviews written by a rider, or received by a workshop. */
  getReviews(userId: number, page: number, size: number): Observable<PagedResponse<ReviewRow>> {
    return this.get<PagedResponse<ReviewRow>>(`${this.baseUrl}/${userId}/reviews`, { page, size });
  }

  private get<T>(url: string, query?: Record<string, string | number>): Observable<T> {
    let params = new HttpParams();
    for (const [key, value] of Object.entries(query ?? {})) {
      params = params.set(key, value);
    }
    return this.http.get<ApiResponse<T>>(url, { params }).pipe(map((response) => response.data));
  }
}
