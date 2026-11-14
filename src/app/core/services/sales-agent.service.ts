import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, map } from 'rxjs';
import { environment } from '../../../environments/environment';
import { ApiResponse } from '../models/api-response';
import { PagedResponse } from '../models/paged-response';
import { DirectoryQuery } from '../models/directory-query';
import { SalesAgent } from '../models/sales-agent';

@Injectable({ providedIn: 'root' })
export class SalesAgentService {
  constructor(private http: HttpClient) {}

  getSalesAgents(query: DirectoryQuery): Observable<PagedResponse<SalesAgent>> {
    const params = new HttpParams()
      .set('page', query.page)
      .set('size', query.size)
      .set('search', query.search)
      .set('sortBy', query.sortBy)
      .set('sortDir', query.sortDir)
      .set('status', query.status ?? 'ALL');

    return this.http
      .get<ApiResponse<PagedResponse<SalesAgent>>>(`${environment.apiUrl}/api/users/sales-agents`, { params })
      .pipe(map((response) => response.data));
  }
}
