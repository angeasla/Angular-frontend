import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule, CurrencyPipe } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { MatDialogModule } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { provideNativeDateAdapter, MAT_DATE_LOCALE } from '@angular/material/core';
import { TranslateModule } from '@ngx-translate/core';

interface EasterBonusResults {
  calendarDays: number;
  baseBonus: number;
  increment: number;
  finalBonus: number;
  isFullBonus: boolean;
}

@Component({
  selector: 'app-easter-bonus-dialog',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatDialogModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatButtonModule,
    MatIconModule,
    MatDatepickerModule,
    CurrencyPipe,
    TranslateModule,
  ],
  providers: [
    provideNativeDateAdapter(),
    { provide: MAT_DATE_LOCALE, useValue: 'el-GR' },
  ],
  templateUrl: './easter-bonus-dialog.component.html',
  styleUrl: './easter-bonus-dialog.component.scss',
})
export class EasterBonusDialogComponent implements OnInit, OnDestroy {
  form: FormGroup;
  results: EasterBonusResults | null = null;
  minDate: Date;
  maxDate: Date;

  private destroy$ = new Subject<void>();

  constructor(private fb: FormBuilder) {
    const currentYear = new Date().getFullYear();
    // Easter bonus period is strictly Jan 1 to Apr 30
    this.minDate = new Date(currentYear, 0, 1);  // Jan 1
    this.maxDate = new Date(currentYear, 3, 30); // Apr 30

    this.form = this.fb.group({
      employeeType: ['salary', Validators.required],
      amount: [1200, [Validators.required, Validators.min(1)]],
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
    const amount = parseFloat(vals.amount) || 0;
    const isSalary = vals.employeeType === 'salary';
    const start = vals.startDate ? new Date(vals.startDate) : null;
    const end = vals.endDate ? new Date(vals.endDate) : null;

    if (amount <= 0 || !start || !end || start > end) { this.results = null; return; }

    // Calculate inclusive calendar days between dates
    const timeDiff = end.getTime() - start.getTime();
    const calendarDays = Math.round(timeDiff / (1000 * 3600 * 24)) + 1;

    // Legal Ratio: For every 8 days, 1 wage OR 1/15 of half salary (which is salary/30)
    const ratio = calendarDays / 8;
    const baseUnit = isSalary ? (amount / 30) : amount;
    const baseBonus = ratio * baseUnit;

    // Holiday Bonus Increment (Leave Allowance 0.04166)
    const increment = baseBonus * 0.04166;
    const finalBonus = baseBonus + increment;

    // Check if max possible (employed for the whole period)
    const maxPossibleDays = Math.round((this.maxDate.getTime() - this.minDate.getTime()) / (1000 * 3600 * 24)) + 1;
    const isFullBonus = calendarDays === maxPossibleDays;

    this.results = {
      calendarDays,
      baseBonus,
      increment,
      finalBonus,
      isFullBonus,
    };
  }
}
