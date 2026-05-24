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
import { MatDatepickerModule } from '@angular/material/datepicker';
import { provideNativeDateAdapter, MAT_DATE_LOCALE } from '@angular/material/core';
import { TranslateModule } from '@ngx-translate/core';

interface ChristmasBonusResults {
  calendarDays: number;
  baseBonus: number;
  increment: number;
  finalBonus: number;
  isFullBonus: boolean;
}

@Component({
  selector: 'app-christmas-bonus-dialog',
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
    CurrencyPipe,
    TranslateModule,
  ],
  providers: [
    provideNativeDateAdapter(),
    { provide: MAT_DATE_LOCALE, useValue: 'el-GR' },
  ],
  templateUrl: './christmas-bonus-dialog.component.html',
  styleUrl: './christmas-bonus-dialog.component.scss',
})
export class ChristmasBonusDialogComponent implements OnInit, OnDestroy {
  form: FormGroup;
  results: ChristmasBonusResults | null = null;
  minDate: Date;
  maxDate: Date;

  private destroy$ = new Subject<void>();

  constructor(private fb: FormBuilder) {
    const currentYear = new Date().getFullYear();
    // Christmas bonus period is strictly May 1 to Dec 31
    this.minDate = new Date(currentYear, 4, 1);   // May 1
    this.maxDate = new Date(currentYear, 11, 31); // Dec 31

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

    // Calculate inclusive calendar days (using Math.round to avoid DST bugs)
    const timeDiff = end.getTime() - start.getTime();
    const calendarDays = Math.round(timeDiff / (1000 * 3600 * 24)) + 1;

    // Check if max possible (employed for the whole period)
    const maxPossibleDays = Math.round((this.maxDate.getTime() - this.minDate.getTime()) / (1000 * 3600 * 24)) + 1;
    const isFullBonus = calendarDays >= maxPossibleDays;

    let baseBonus = 0;

    if (isFullBonus) {
      // Full period: 1 full salary or 25 daily wages
      baseBonus = isSalary ? amount : (amount * 25);
    } else {
      // Partial period: For every 19 days -> 2/25 of salary OR 2 daily wages
      const ratio = calendarDays / 19;
      if (isSalary) {
        baseBonus = ratio * (amount * 2 / 25);
      } else {
        baseBonus = ratio * (amount * 2);
      }
    }

    // Holiday Bonus Increment (Leave Allowance 0.04166)
    const increment = baseBonus * 0.04166;
    const finalBonus = baseBonus + increment;

    this.results = {
      calendarDays,
      baseBonus,
      increment,
      finalBonus,
      isFullBonus,
    };
  }
}
