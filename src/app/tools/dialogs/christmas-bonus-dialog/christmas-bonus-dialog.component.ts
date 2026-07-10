import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule, CurrencyPipe } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { Subject } from 'rxjs';
import { debounceTime, takeUntil } from 'rxjs/operators';
import { MatDialogModule } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { provideNativeDateAdapter, MAT_DATE_LOCALE } from '@angular/material/core';
import { TranslateModule } from '@ngx-translate/core';
import { CalculatorService } from '../../../services/calculator.service';
import { inclusiveDays } from '../../../services/date-utils';

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

  constructor(private fb: FormBuilder, private calc: CalculatorService) {
    const currentYear = new Date().getFullYear();
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
    this.triggerCalculation();

    this.form.valueChanges
      .pipe(debounceTime(300), takeUntil(this.destroy$))
      .subscribe(() => this.triggerCalculation());
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private triggerCalculation(): void {
    const vals = this.form.value;
    const amount = parseFloat(vals.amount) || 0;
    const isSalary = vals.employeeType === 'salary';
    const start = vals.startDate ? new Date(vals.startDate) : null;
    const end = vals.endDate ? new Date(vals.endDate) : null;

    if (amount <= 0 || !start || !end || start > end) { this.results = null; return; }

    const calendarDays = inclusiveDays(start, end);
    // Christmas full-bonus threshold: 245 calendar days of the period
    const isFullBonus = calendarDays >= 245;

    const call$ = isSalary
      ? this.calc.xmasBonus({ monthlySalary: amount, workedDays: calendarDays })
      : this.calc.xmasPartTime({ dailyWage: amount, workedDays: calendarDays });

    call$.pipe(takeUntil(this.destroy$)).subscribe(r => {
      this.results = {
        calendarDays,
        baseBonus: r.base,
        increment: r.amount - r.base,
        finalBonus: r.amount,
        isFullBonus,
      };
    });
  }
}
