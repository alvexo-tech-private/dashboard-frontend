import { Component, input, signal } from '@angular/core';
import { HttpErrorResponse } from '@angular/common/http';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatMenuModule } from '@angular/material/menu';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar } from '@angular/material/snack-bar';
import { ExportFormat, ReportFilters, ReportRange } from '../../core/models/report';
import { ReportPath, ReportService, saveFile } from '../../core/services/report.service';
import { apiErrorMessage } from '../../core/utils/http-error-message';

/**
 * "Export" button for a report: downloads the currently filtered rows as CSV
 * or XLSX (ADMIN-US-22). The backend builds the file from the same query as
 * the screen and records the export in the audit log.
 */
@Component({
  selector: 'app-export-menu',
  imports: [MatButtonModule, MatIconModule, MatMenuModule, MatProgressSpinnerModule],
  template: `
    <button mat-stroked-button [matMenuTriggerFor]="menu" [disabled]="disabled() || busy()">
      @if (busy()) {
        <mat-spinner diameter="18"></mat-spinner>
      } @else {
        <mat-icon>download</mat-icon>
      }
      Export
    </button>
    <mat-menu #menu="matMenu">
      <button mat-menu-item (click)="download('XLSX')">
        <mat-icon>grid_on</mat-icon>
        <span>Excel (.xlsx)</span>
      </button>
      <button mat-menu-item (click)="download('CSV')">
        <mat-icon>description</mat-icon>
        <span>CSV (.csv)</span>
      </button>
    </mat-menu>
  `,
  styles: `
    mat-spinner {
      display: inline-block;
      margin-right: 8px;
    }
  `,
})
export class ExportMenu {
  readonly path = input.required<ReportPath>();
  readonly range = input.required<ReportRange>();
  readonly filters = input<ReportFilters>({});
  readonly disabled = input(false);

  readonly busy = signal(false);

  constructor(
    private reportService: ReportService,
    private snackBar: MatSnackBar,
  ) {}

  download(format: ExportFormat): void {
    this.busy.set(true);
    this.reportService.export(this.path(), this.range(), this.filters(), format).subscribe({
      next: (file) => {
        saveFile(file);
        this.busy.set(false);
      },
      error: async (err) => {
        this.busy.set(false);
        this.snackBar.open(await exportErrorMessage(err), 'Dismiss', { duration: 6000 });
      },
    });
  }
}

/** An export error arrives as a Blob (responseType: 'blob'), so its JSON message has to be read out first. */
async function exportErrorMessage(err: unknown): Promise<string> {
  const fallback = 'Could not export the report.';
  if (err instanceof HttpErrorResponse && err.error instanceof Blob) {
    try {
      const parsed = JSON.parse(await err.error.text());
      return apiErrorMessage(new HttpErrorResponse({ error: parsed, status: err.status }), fallback);
    } catch {
      return fallback;
    }
  }
  return apiErrorMessage(err, fallback);
}
