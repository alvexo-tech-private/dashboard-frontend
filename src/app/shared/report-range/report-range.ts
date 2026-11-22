import { Component, effect, input, output } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { MatChipsModule } from '@angular/material/chips';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { provideNativeDateAdapter } from '@angular/material/core';
import { ReportRange } from '../../core/models/report';
import { RANGE_PRESETS, RangePreset, fromIsoDate, toIsoDate } from '../../core/utils/report-range';

/** Date range picker with quick presets, shared by every report screen. Emits only complete ranges. */
@Component({
  selector: 'app-report-range',
  imports: [ReactiveFormsModule, MatChipsModule, MatDatepickerModule, MatFormFieldModule, MatInputModule],
  providers: [provideNativeDateAdapter()],
  template: `
    <div class="report-range">
      <mat-form-field appearance="outline" class="range-field" subscriptSizing="dynamic">
        <mat-label>Date range</mat-label>
        <mat-date-range-input [formGroup]="form" [rangePicker]="picker">
          <input matStartDate formControlName="start" placeholder="From" />
          <input matEndDate formControlName="end" placeholder="To" (dateChange)="onEndPicked()" />
        </mat-date-range-input>
        <mat-datepicker-toggle matIconSuffix [for]="picker"></mat-datepicker-toggle>
        <mat-date-range-picker #picker></mat-date-range-picker>
      </mat-form-field>

      <mat-chip-set aria-label="Quick ranges">
        @for (preset of presets; track preset.label) {
          <mat-chip
            class="preset"
            [class.preset--active]="isActive(preset)"
            (click)="changed.emit(preset.range(today()))"
            >{{ preset.label }}</mat-chip
          >
        }
      </mat-chip-set>
    </div>
  `,
  styles: `
    .report-range {
      display: flex;
      flex-wrap: wrap;
      align-items: center;
      gap: 12px 16px;
    }
    .range-field {
      width: 280px;
      max-width: 100%;
    }
    .preset {
      cursor: pointer;
    }
    .preset--active {
      --mat-chip-elevated-container-color: var(--mat-sys-primary-container);
      --mat-chip-label-text-color: var(--mat-sys-primary);
    }
  `,
})
export class ReportRangePicker {
  readonly value = input.required<ReportRange>();
  readonly changed = output<ReportRange>();

  readonly presets = RANGE_PRESETS;
  readonly form = new FormGroup({
    start: new FormControl<Date | null>(null),
    end: new FormControl<Date | null>(null),
  });

  constructor() {
    effect(() => {
      const range = this.value();
      this.form.setValue({ start: fromIsoDate(range.from), end: fromIsoDate(range.to) }, { emitEvent: false });
    });
  }

  today(): Date {
    return new Date();
  }

  isActive(preset: RangePreset): boolean {
    const range = preset.range(this.today());
    return range.from === this.value().from && range.to === this.value().to;
  }

  /** The end date is picked last, so a complete range exists from here on. */
  onEndPicked(): void {
    const { start, end } = this.form.getRawValue();
    if (start && end) {
      this.changed.emit({ from: toIsoDate(start), to: toIsoDate(end) });
    }
  }
}
