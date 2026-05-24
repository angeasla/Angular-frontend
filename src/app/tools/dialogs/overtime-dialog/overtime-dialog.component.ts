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
import { MatCheckboxModule } from '@angular/material/checkbox';
import { TranslateModule } from '@ngx-translate/core';

interface OvertimeResults {
  hourlyRate: number;
  overworkRate: number;
  legalOvertime: number;
  illegalOvertime: number;
  nightShiftIncrement: number;
  totalNightRate: number;
  sixthDayStandard: number;
  sixthDayShift: number;
}

@Component({
  selector: 'app-overtime-dialog',
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
    MatCheckboxModule,
    CurrencyPipe,
    TranslateModule,
  ],
  templateUrl: './overtime-dialog.component.html',
  styleUrl: './overtime-dialog.component.scss',
})
export class OvertimeDialogComponent implements OnInit, OnDestroy {
  form: FormGroup;
  results: OvertimeResults | null = null;

  private destroy$ = new Subject<void>();

  constructor(private fb: FormBuilder) {
    this.form = this.fb.group({
      employeeType: ['salary', Validators.required],
      grossAmount: [1200, [Validators.required, Validators.min(1)]],
      hoursPerWeek: [40, [Validators.required, Validators.min(1), Validators.max(40)]],
      isBasicSalary: [false],
      legalBaseAmount: [830, [Validators.required, Validators.min(1)]],
    });
  }

  ngOnInit(): void {
    this.calculate();

    // Toggle legalBaseAmount field based on checkbox
    this.form.get('isBasicSalary')?.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe(isBasic => {
        if (isBasic) {
          this.form.get('legalBaseAmount')?.disable();
          this.form.get('legalBaseAmount')?.setValue(this.form.get('grossAmount')?.value);
        } else {
          this.form.get('legalBaseAmount')?.enable();
        }
      });

    // Auto-update legal base if checkbox is checked and gross amount changes
    this.form.get('grossAmount')?.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe(val => {
        if (this.form.get('isBasicSalary')?.value) {
          this.form.get('legalBaseAmount')?.setValue(val, { emitEvent: false });
        }
      });

    this.form.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => this.calculate());
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private calculate(): void {
    const vals = this.form.getRawValue(); // Use getRawValue to include disabled fields
    const amount = parseFloat(vals.grossAmount) || 0;
    const legalAmount = parseFloat(vals.legalBaseAmount) || amount;
    const hours = parseFloat(vals.hoursPerWeek) || 40;
    const isSalary = vals.employeeType === 'salary';

    if (amount <= 0 || hours <= 0) { this.results = null; return; }

    // 1. Daily Wage Calculation
    const dailyWage = isSalary ? amount / 25 : amount;
    const legalDailyWage = isSalary ? legalAmount / 25 : legalAmount;

    // 2. Hourly Rate Calculation (Law: Daily * (6 / hours))
    const hourlyRate = dailyWage * (6 / hours);
    const legalHourlyRate = legalDailyWage * (6 / hours);

    // 3. Overwork - +20% on actual hourly rate
    const overworkRate = hourlyRate * 1.20;

    // 4. Overtime
    const legalOvertime = hourlyRate * 1.40;    // +40%
    const illegalOvertime = hourlyRate * 2.20;  // +120%

    // 5. Night Shift - +25% on LEGAL hourly rate
    const nightShiftIncrement = legalHourlyRate * 0.25;
    const totalNightRate = hourlyRate + nightShiftIncrement;

    // 6. 6th Day of week (Saturday)
    const sixthDayStandard = dailyWage * 1.30; // 30% increment for 5-day workers
    const sixthDayShift = dailyWage * 1.40;    // 40% increment for continuous shift businesses

    this.results = {
      hourlyRate,
      overworkRate,
      legalOvertime,
      illegalOvertime,
      nightShiftIncrement,
      totalNightRate,
      sixthDayStandard,
      sixthDayShift,
    };
  }
}
