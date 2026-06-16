import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule, CurrencyPipe } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { Subject } from 'rxjs';
import { debounceTime, takeUntil } from 'rxjs/operators';
import { MatDialogModule } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { provideNativeDateAdapter, MAT_DATE_LOCALE } from '@angular/material/core';
import { TranslateModule } from '@ngx-translate/core';
import { CalculatorService } from '../../../services/calculator.service';
import { inclusiveDays } from '../../../services/date-utils';

interface EasterHourlyResults {
  averageWage: number;
  calendarDays: number;
  ratio: string;
  baseBonus: number;
  increment: number;
  finalBonus: number;
}

@Component({
  selector: 'app-easter-hourly-dialog',
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
  templateUrl: './easter-hourly-dialog.component.html',
  styleUrl: './easter-hourly-dialog.component.scss',
})
export class EasterHourlyDialogComponent implements OnInit, OnDestroy {
  form: FormGroup;
  results: EasterHourlyResults | null = null;
  minDate: Date;
  maxDate: Date;

  private destroy$ = new Subject<void>();

  constructor(private fb: FormBuilder, private calc: CalculatorService) {
    const currentYear = new Date().getFullYear();
    this.minDate = new Date(currentYear, 0, 1);
    this.maxDate = new Date(currentYear, 3, 30);

    this.form = this.fb.group({
      totalEarnings: [1500, [Validators.required, Validators.min(1)]],
      daysWorked: [60, [Validators.required, Validators.min(1)]],
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
    const totalEarnings = parseFloat(vals.totalEarnings) || 0;
    const daysWorked = parseInt(vals.daysWorked) || 0;
    const start = vals.startDate ? new Date(vals.startDate) : null;
    const end = vals.endDate ? new Date(vals.endDate) : null;

    if (totalEarnings <= 0 || daysWorked <= 0 || !start || !end || start > end) {
      this.results = null;
      return;
    }

    const calendarDays = inclusiveDays(start, end);
    // averageWage is purely for display; derive client-side (no legal formula involved)
    const averageWage = totalEarnings / daysWorked;

    this.calc.easterHourly({ totalEarnings, actualDaysWorked: daysWorked, calendarDays })
      .pipe(takeUntil(this.destroy$))
      .subscribe(r => {
        this.results = {
          averageWage,
          calendarDays,
          ratio: r.units.toFixed(2),
          baseBonus: r.base,
          increment: r.amount - r.base,
          finalBonus: r.amount,
        };
      });
  }
}
