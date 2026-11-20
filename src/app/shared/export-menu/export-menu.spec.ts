import { TestBed } from '@angular/core/testing';
import { HttpErrorResponse } from '@angular/common/http';
import { MatSnackBar } from '@angular/material/snack-bar';
import { throwError } from 'rxjs';
import { ExportMenu } from './export-menu';
import { ReportService } from '../../core/services/report.service';

describe('ExportMenu', () => {
  let reportService: jasmine.SpyObj<ReportService>;
  let snackBar: jasmine.SpyObj<MatSnackBar>;

  beforeEach(() => {
    reportService = jasmine.createSpyObj<ReportService>('ReportService', ['export']);
    snackBar = jasmine.createSpyObj<MatSnackBar>('MatSnackBar', ['open']);
    TestBed.configureTestingModule({
      imports: [ExportMenu],
      providers: [
        { provide: ReportService, useValue: reportService },
        { provide: MatSnackBar, useValue: snackBar },
      ],
    });
  });

  function create() {
    const fixture = TestBed.createComponent(ExportMenu);
    fixture.componentRef.setInput('path', 'bookings');
    fixture.componentRef.setInput('range', { from: '2026-11-01', to: '2026-11-20' });
    fixture.componentRef.setInput('filters', { status: 'COMPLETED' });
    fixture.detectChanges();
    return fixture;
  }

  it('requests the export with the current range and filters', () => {
    reportService.export.and.returnValue(throwError(() => new HttpErrorResponse({ status: 500 })));
    const fixture = create();

    fixture.componentInstance.download('XLSX');

    expect(reportService.export).toHaveBeenCalledWith(
      'bookings',
      { from: '2026-11-01', to: '2026-11-20' },
      { status: 'COMPLETED' },
      'XLSX',
    );
  });

  it("shows the backend's message from a blob error body (e.g. too many rows)", async () => {
    const body = new Blob([JSON.stringify({ message: 'Pick a shorter date range or add a filter.' })], {
      type: 'application/json',
    });
    reportService.export.and.returnValue(throwError(() => new HttpErrorResponse({ status: 400, error: body })));
    const fixture = create();

    fixture.componentInstance.download('CSV');
    // Reading the Blob body is async; wait for the message to be shown.
    for (let i = 0; i < 50 && snackBar.open.calls.count() === 0; i++) {
      await new Promise((resolve) => setTimeout(resolve, 10));
    }

    expect(snackBar.open).toHaveBeenCalledWith('Pick a shorter date range or add a filter.', 'Dismiss', jasmine.any(Object));
    expect(fixture.componentInstance.busy()).toBeFalse();
  });
});
