import { Component, effect, input, signal, untracked } from '@angular/core';
import { CurrencyPipe, DecimalPipe } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatTableModule } from '@angular/material/table';
import { PagedResponse } from '../../../core/models/paged-response';
import { ReportRange, WorkshopPerformanceRow } from '../../../core/models/report';
import { ReportService } from '../../../core/services/report.service';
import { httpErrorMessage } from '../../../core/utils/http-error-message';
import { ExportMenu } from '../../../shared/export-menu/export-menu';

/** Per-workshop booking outcomes and ratings in the range, busiest workshop first. */
@Component({
  selector: 'app-workshop-performance-report',
  imports: [
    CurrencyPipe,
    DecimalPipe,
    MatCardModule,
    MatIconModule,
    MatPaginatorModule,
    MatProgressSpinnerModule,
    MatTableModule,
    ExportMenu,
  ],
  templateUrl: './workshop-performance-report.html',
  styleUrl: './workshop-performance-report.scss',
})
export class WorkshopPerformanceReport {
  readonly range = input.required<ReportRange>();

  readonly columns = ['workshop', 'total', 'completed', 'cancelled', 'rejected', 'rate', 'value', 'rating'];
  readonly pageSizeOptions = [10, 20, 50, 100];

  readonly result = signal<PagedResponse<WorkshopPerformanceRow> | null>(null);
  readonly loading = signal(true);
  readonly error = signal<string | null>(null);
  readonly pageIndex = signal(0);
  readonly pageSize = signal(20);

  constructor(private reportService: ReportService) {
    effect(() => {
      this.range();
      untracked(() => {
        this.pageIndex.set(0);
        this.load();
      });
    });
  }

  onPageChange(event: PageEvent): void {
    this.pageIndex.set(event.pageIndex);
    this.pageSize.set(event.pageSize);
    this.load();
  }

  private load(): void {
    this.loading.set(true);
    this.error.set(null);
    this.reportService.getWorkshopPerformance(this.range(), this.pageIndex(), this.pageSize()).subscribe({
      next: (result) => {
        this.result.set(result);
        this.loading.set(false);
      },
      error: (err) => {
        this.error.set(httpErrorMessage(err, 'Could not load the workshop performance report.'));
        this.loading.set(false);
      },
    });
  }
}
