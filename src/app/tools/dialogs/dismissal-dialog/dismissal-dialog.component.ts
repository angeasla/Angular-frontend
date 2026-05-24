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
import { TranslateModule } from '@ngx-translate/core';

interface DismissalResults {
  baseMonthly: number;
  calcSalary: number;
  requiredWarning: number;
  warningGiven: number;
  warningIsValid: boolean;
  monthsComp: number;
  multiplier: number;
  finalAmount: number;
}

@Component({
  selector: 'app-dismissal-dialog',
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
    CurrencyPipe,
    TranslateModule,
  ],
  templateUrl: './dismissal-dialog.component.html',
  styleUrl: './dismissal-dialog.component.scss',
})
export class DismissalDialogComponent implements OnInit, OnDestroy {
  form: FormGroup;
  results: DismissalResults | null = null;

  private destroy$ = new Subject<void>();

  constructor(private fb: FormBuilder) {
    this.form = this.fb.group({
      employeeType: ['salary', Validators.required],
      amount: [1000, [Validators.required, Validators.min(1)]],
      years: [5, [Validators.required, Validators.min(0)]],
      warningGiven: [0, Validators.required],
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
    const years = parseInt(vals.years) || 0;
    const warningGiven = parseInt(vals.warningGiven) || 0;

    if (amount <= 0) { this.results = null; return; }

    // 1. Calculate Base Monthly Salary (Law 4808/2021 treats wage * 22 as monthly salary)
    const baseMonthly = vals.employeeType === 'salary' ? amount : amount * 22;

    // 2. Add 1/6 increment for Holiday Bonuses (Legal Standard)
    const calcSalary = baseMonthly * (14 / 12);

    // 3. Determine Required Warning Months (Law 4093/2012)
    let requiredWarning = 0;
    if (years >= 10) requiredWarning = 4;
    else if (years >= 5) requiredWarning = 3;
    else if (years >= 2) requiredWarning = 2;
    else if (years >= 1) requiredWarning = 1;

    // 4. Determine Months of Compensation based on completed years
    let monthsComp = 0;
    if (years < 1) monthsComp = 0;
    else if (years < 4) monthsComp = 2;
    else if (years < 6) monthsComp = 3;
    else if (years < 8) monthsComp = 4;
    else if (years < 10) monthsComp = 5;
    else if (years < 11) monthsComp = 6;
    else if (years < 12) monthsComp = 7;
    else if (years < 13) monthsComp = 8;
    else if (years < 14) monthsComp = 9;
    else if (years < 15) monthsComp = 10;
    else if (years < 16) monthsComp = 11;
    else monthsComp = 12;

    // 5. Check if warning is valid (must be >= required)
    const warningIsValid = requiredWarning > 0 && warningGiven >= requiredWarning;
    const multiplier = warningIsValid ? 0.5 : 1.0;
    const finalAmount = monthsComp * calcSalary * multiplier;

    this.results = {
      baseMonthly,
      calcSalary,
      requiredWarning,
      warningGiven,
      warningIsValid,
      monthsComp,
      multiplier,
      finalAmount,
    };
  }
}
