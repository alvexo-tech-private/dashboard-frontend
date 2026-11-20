import { Component, effect, input, signal, untracked } from '@angular/core';
import { DatePipe } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatTableModule } from '@angular/material/table';
import { RegistrationReport, RegistrationReportRow, ReportRange } from '../../../core/models/report';
import { ReportService } from '../../../core/services/report.service';
import { httpErrorMessage } from '../../../core/utils/http-error-message';
import { ExportMenu } from '../../../shared/export-menu/export-menu';

/** New riders, workshops and sales agents per day. The backend returns every day in the range; paging is local. */
@Component({
  selector: 'app-registrations-report',
  imports: [DatePipe, MatCardModule, MatIconModule, MatPaginatorModule, MatProgressSpinnerModule, MatTableModule, ExportMenu],
  templateUrl: './registrations-report.html',
  styleUrl: './registrations-report.scss',
})
export class RegistrationsReport {
  readonly range = input.required<ReportRange>();

  readonly columns = ['date', 'riders', 'workshops', 'salesAgents', 'total'];
  readonly pageSizeOptions = [10, 31, 100];

  readonly report = signal<RegistrationReport | null>(null);
  readonly loading = signal(true);
  readonly error = signal<string | null>(null);
  readonly pageIndex = signal(0);
  readonly pageSize = signal(31);

  constructor(private reportService: ReportService) {
    effect(() => {
      const range = this.range();
      untracked(() => this.load(range));
    });
  }

  pageRows(report: RegistrationReport): RegistrationReportRow[] {
    const start = this.pageIndex() * this.pageSize();
    return report.days.slice(start, start + this.pageSize());
  }

  onPageChange(event: PageEvent): void {
    this.pageIndex.set(event.pageIndex);
    this.pageSize.set(event.pageSize);
  }

  private load(range: ReportRange): void {
    this.loading.set(true);
    this.error.set(null);
    this.pageIndex.set(0);
    this.reportService.getRegistrations(range).subscribe({
      next: (report) => {
        this.report.set(report);
        this.loading.set(false);
      },
      error: (err) => {
        this.error.set(httpErrorMessage(err, 'Could not load the registrations report.'));
        this.loading.set(false);
      },
    });
  }
}
