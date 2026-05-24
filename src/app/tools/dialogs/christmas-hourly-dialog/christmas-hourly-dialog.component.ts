import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule, CurrencyPipe } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { MatDialogModule } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { provideNativeDateAdapter, MAT_DATE_LOCALE } from '@angular/material/core';
import { TranslateModule } from '@ngx-translate/core';

interface ChristmasHourlyResults {
  averageWage: number;
  calendarDays: number;
  ratio: string;
  baseBonus: number;
  increment: number;
  finalBonus: number;
}

@Component({
  selector: 'app-christmas-hourly-dialog',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatDialogModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatDatepickerModule,
    CurrencyPipe,
    TranslateModule,
  ],
  providers: [
    provideNativeDateAdapter(),
    { provide: MAT_DATE_LOCALE, useValue: 'el-GR' },
  ],
  templateUrl: './christmas-hourly-dialog.component.html',
  styleUrl: './christmas-hourly-dialog.component.scss',
})
export class ChristmasHourlyDialogComponent implements OnInit, OnDestroy {
  form: FormGroup;
  results: ChristmasHourlyResults | null = null;
  minDate: Date;
  maxDate: Date;

  private destroy$ = new Subject<void>();

  constructor(private fb: FormBuilder) {
    const currentYear = new Date().getFullYear();
    // Christmas period: May 1 to Dec 31
    this.minDate = new Date(currentYear, 4, 1);
    this.maxDate = new Date(currentYear, 11, 31);

    this.form = this.fb.group({
      totalEarnings: [1500, [Validators.required, Validators.min(1)]],
      daysWorked: [80, [Validators.required, Validators.min(1)]],
      startDate: [this.minDate, Validators.required],
      endDate: [this.maxDate, Validators.required],
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

  private calculate(): void {
    const vals = this.form.value;
    const totalEarnings = parseFloat(vals.totalEarnings) || 0;
    const daysWorked = parseInt(vals.daysWorked) || 0;
    const start = vals.startDate ? new Date(vals.startDate) : null;
    const end = vals.endDate ? new Date(vals.endDate) : null;

    if (totalEarnings <= 0 || daysWorked <= 0 || !start || !end || start > end) {
      this.results = null;
      return;
    }

    // 1. Calculate Average Daily Wage
    const averageWage = totalEarnings / daysWorked;

    // 2. Calculate Calendar Days (using Math.round for DST safety)
    const timeDiff = end.getTime() - start.getTime();
    const calendarDays = Math.round(timeDiff / (1000 * 3600 * 24)) + 1;

    // 3. Ratio Calculation
    const maxPossibleDays = Math.round((this.maxDate.getTime() - this.minDate.getTime()) / (1000 * 3600 * 24)) + 1;
    let ratio = 0;
    if (calendarDays >= maxPossibleDays) {
      ratio = 25; // Max 25 wages for the full period
    } else {
      ratio = (calendarDays / 19) * 2; // Law: 2 wages for every 19 days
    }

    // 4. Base Bonus
    const baseBonus = ratio * averageWage;

    // 5. Holiday Increment
    const increment = baseBonus * 0.04166;
    const finalBonus = baseBonus + increment;

    this.results = {
      averageWage,
      calendarDays,
      ratio: ratio.toFixed(2),
      baseBonus,
      increment,
      finalBonus,
    };
  }
}
