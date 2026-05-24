import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { MatDialogModule } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { provideNativeDateAdapter, MAT_DATE_LOCALE } from '@angular/material/core';
import { TranslateModule } from '@ngx-translate/core';

interface MaternityResults {
  endDate: Date;
  workingDaysCount: number;
  expectedLeaveDays: number;
  totalHoursOwed: string;
  continuousDays: string;
  continuousMonths: string;
}

@Component({
  selector: 'app-maternity-leave-dialog',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatDialogModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatButtonModule,
    MatDatepickerModule,
    TranslateModule,
  ],
  providers: [
    provideNativeDateAdapter(),
    { provide: MAT_DATE_LOCALE, useValue: 'el-GR' },
  ],
  templateUrl: './maternity-leave-dialog.component.html',
  styleUrl: './maternity-leave-dialog.component.scss',
})
export class MaternityLeaveDialogComponent implements OnInit, OnDestroy {
  form: FormGroup;
  results: MaternityResults | null = null;

  private destroy$ = new Subject<void>();

  constructor(private fb: FormBuilder) {
    this.form = this.fb.group({
      startDate: [new Date(), Validators.required],
      workweek: [5, Validators.required],
      annualLeaveDays: [20, [Validators.required, Validators.min(20), Validators.max(30)]],
    });
  }

  ngOnInit(): void {
    this.calculate();

    this.form.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => this.calculate());
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  // Orthodox Easter Calculator (Meeus/Jones/Butcher algorithm adapted for Julian to Gregorian)
  private getOrthodoxEaster(year: number): Date {
    const a = year % 19;
    const b = year % 4;
    const c = year % 7;
    const d = (19 * a + 15) % 30;
    const e = (2 * b + 4 * c + 6 * d + 6) % 7;
    const f = d + e;

    // Julian Easter
    let month = f > 9 ? 4 : 3;
    let day = f > 9 ? f - 9 : f + 22;

    // Convert Julian to Gregorian (Add 13 days for years 1900-2099)
    const julianEaster = new Date(year, month - 1, day);
    const gregorianEaster = new Date(julianEaster.getTime() + (13 * 24 * 60 * 60 * 1000));
    return gregorianEaster;
  }

  private isGreekHoliday(date: Date): boolean {
    const d = date.getDate();
    const m = date.getMonth() + 1; // 1-12
    const y = date.getFullYear();

    // Fixed Holidays
    if (
      (d === 1 && m === 1) ||   // New Year
      (d === 6 && m === 1) ||   // Epiphany
      (d === 25 && m === 3) ||  // Independence Day
      (d === 1 && m === 5) ||   // Labor Day
      (d === 15 && m === 8) ||  // Assumption
      (d === 28 && m === 10) || // Oxi Day
      (d === 25 && m === 12) || // Christmas
      (d === 26 && m === 12)    // Boxing Day
    ) { return true; }

    // Movable Holidays
    const easter = this.getOrthodoxEaster(y);
    const easterTime = easter.getTime();
    const dateTime = new Date(y, date.getMonth(), d).getTime();
    const dayInMs = 24 * 60 * 60 * 1000;

    const cleanMonday = easterTime - (48 * dayInMs);
    const goodFriday = easterTime - (2 * dayInMs);
    const easterMonday = easterTime + (1 * dayInMs);
    const holySpirit = easterTime + (50 * dayInMs);

    if (dateTime === cleanMonday || dateTime === goodFriday || dateTime === easterMonday || dateTime === holySpirit) {
      return true;
    }

    return false;
  }

  private calculate(): void {
    const vals = this.form.value;
    const start = vals.startDate ? new Date(vals.startDate) : null;
    const is5day = parseInt(vals.workweek) === 5;
    const annualLeave = parseInt(vals.annualLeaveDays) || 20;

    if (!start) { this.results = null; return; }

    // End date is exactly 30 months later
    const end = new Date(start);
    end.setMonth(end.getMonth() + 30);

    let workingDaysCount = 0;
    let currentDate = new Date(start);

    // Strip time for safe iteration
    currentDate.setHours(0, 0, 0, 0);
    const endDateStr = end.getTime();

    // Loop through every day of the 30 months
    while (currentDate.getTime() < endDateStr) {
      const dayOfWeek = currentDate.getDay(); // 0 = Sunday, 6 = Saturday
      const isWeekend = is5day ? (dayOfWeek === 0 || dayOfWeek === 6) : (dayOfWeek === 0);

      if (!isWeekend && !this.isGreekHoliday(currentDate)) {
        workingDaysCount++;
      }

      currentDate.setDate(currentDate.getDate() + 1);
    }

    // Deduct annual leave for 2.5 years (30 months)
    const expectedLeaveDays = annualLeave * 2.5;
    const actualDaysWorked = Math.max(0, workingDaysCount - expectedLeaveDays);

    // Each actual working day gives 1 hour of reduced work
    const totalHoursOwed = actualDaysWorked;

    // Convert hours to continuous days based on workweek
    // 5-day week = 8 hours/day. 6-day week = 6.666 hours/day
    const dailyHours = is5day ? 8 : (40 / 6);
    const continuousDays = totalHoursOwed / dailyHours;

    this.results = {
      endDate: end,
      workingDaysCount,
      expectedLeaveDays,
      totalHoursOwed: totalHoursOwed.toFixed(1),
      continuousDays: continuousDays.toFixed(1),
      continuousMonths: (continuousDays / 25).toFixed(1),
    };
  }
}
