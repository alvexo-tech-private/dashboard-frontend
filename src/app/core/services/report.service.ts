import { Injectable } from '@angular/core';
import { HttpClient, HttpParams, HttpResponse } from '@angular/common/http';
import { Observable, map } from 'rxjs';
import { environment } from '../../../environments/environment';
import { ApiResponse } from '../models/api-response';
import { PagedResponse } from '../models/paged-response';
import {
  BookingReport,
  ExportFormat,
  RegistrationReport,
  ReportFilters,
  ReportRange,
  SettlementLine,
  SettlementReport,
  SettlementWorkshopRow,
  WorkshopPerformanceRow,
} from '../models/report';

/** Report paths under /api/reports; each also has an `/export` endpoint. */
export type ReportPath =
  | 'bookings'
  | 'registrations'
  | 'workshop-performance'
  | 'settlements/by-workshop'
  | 'settlements/lines';

export interface ExportedFile {
  blob: Blob;
  filename: string;
}

@Injectable({ providedIn: 'root' })
export class ReportService {
  private readonly baseUrl = `${environment.apiUrl}/api/reports`;

  constructor(private http: HttpClient) {}

  getBookings(range: ReportRange, filters: ReportFilters, page: number, size: number): Observable<BookingReport> {
    return this.get<BookingReport>('bookings', this.params(range, filters, page, size));
  }

  getRegistrations(range: ReportRange): Observable<RegistrationReport> {
    return this.get<RegistrationReport>('registrations', this.params(range));
  }

  getWorkshopPerformance(range: ReportRange, page: number, size: number): Observable<PagedResponse<WorkshopPerformanceRow>> {
    return this.get<PagedResponse<WorkshopPerformanceRow>>('workshop-performance', this.params(range, {}, page, size));
  }

  getSettlementsByWorkshop(
    range: ReportRange,
    filters: ReportFilters,
    page: number,
    size: number,
  ): Observable<SettlementReport<SettlementWorkshopRow>> {
    return this.get<SettlementReport<SettlementWorkshopRow>>(
      'settlements/by-workshop',
      this.params(range, filters, page, size),
    );
  }

  getSettlementLines(
    range: ReportRange,
    filters: ReportFilters,
    page: number,
    size: number,
  ): Observable<SettlementReport<SettlementLine>> {
    return this.get<SettlementReport<SettlementLine>>('settlements/lines', this.params(range, filters, page, size));
  }

  /** Downloads the same rows the screen shows as CSV or XLSX; the backend audit-logs the export. */
  export(path: ReportPath, range: ReportRange, filters: ReportFilters, format: ExportFormat): Observable<ExportedFile> {
    const params = this.params(range, filters).set('format', format);
    return this.http
      .get(`${this.baseUrl}/${path}/export`, { params, observe: 'response', responseType: 'blob' })
      .pipe(map((response) => ({ blob: response.body!, filename: filenameOf(response, path, range, format) })));
  }

  private get<T>(path: ReportPath, params: HttpParams): Observable<T> {
    return this.http.get<ApiResponse<T>>(`${this.baseUrl}/${path}`, { params }).pipe(map((r) => r.data));
  }

  private params(range: ReportRange, filters: ReportFilters = {}, page?: number, size?: number): HttpParams {
    let params = new HttpParams().set('from', range.from).set('to', range.to);
    if (filters.status) params = params.set('status', filters.status);
    if (filters.workshopId != null) params = params.set('workshopId', filters.workshopId);
    if (page != null) params = params.set('page', page);
    if (size != null) params = params.set('size', size);
    return params;
  }
}

function filenameOf(response: HttpResponse<Blob>, path: string, range: ReportRange, format: ExportFormat): string {
  const disposition = response.headers.get('Content-Disposition') ?? '';
  const match = /filename="?([^";]+)"?/i.exec(disposition);
  if (match) return match[1];
  return `${path.replace('/', '-')}_${range.from}_to_${range.to}.${format.toLowerCase()}`;
}

/** Hands a downloaded file to the browser's save flow. */
export function saveFile(file: ExportedFile): void {
  const url = URL.createObjectURL(file.blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = file.filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  setTimeout(() => URL.revokeObjectURL(url), 0);
}
