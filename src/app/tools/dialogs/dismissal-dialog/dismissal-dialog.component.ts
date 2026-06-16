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
import { MatIconModule } from '@angular/material/icon';
import { TranslateModule } from '@ngx-translate/core';
import { CalculatorService } from '../../../services/calculator.service';

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

  constructor(private fb: FormBuilder, private calc: CalculatorService) {
    this.form = this.fb.group({
      employeeType: ['salary', Validators.required],
      amount: [1000, [Validators.required, Validators.min(1)]],
      years: [5, [Validators.required, Validators.min(0)]],
      warningGiven: [0, Validators.required],
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

  /**
   * Derive requiredWarning locally (Law 4093/2012 table) — used only to determine
   * withNotice and to show the valid/invalid message in the template. The actual
   * compensation amount comes entirely from the backend.
   */
  private requiredWarningMonths(years: number): number {
    if (years >= 10) return 4;
    if (years >= 5) return 3;
    if (years >= 2) return 2;
    if (years >= 1) return 1;
    return 0;
  }

  private triggerCalculation(): void {
    const vals = this.form.value;
    const amount = parseFloat(vals.amount) || 0;
    const years = parseInt(vals.years) || 0;
    const warningGiven = parseInt(vals.warningGiven) || 0;

    if (amount <= 0) { this.results = null; return; }

    const grossMonthly = vals.employeeType === 'salary' ? amount : amount * 22;
    const requiredWarning = this.requiredWarningMonths(years);
    const warningIsValid = requiredWarning > 0 && warningGiven >= requiredWarning;
    const withNotice = warningIsValid;

    this.calc.severance({ grossMonthly, years, withNotice })
      .pipe(takeUntil(this.destroy$))
      .subscribe(r => {
        this.results = {
          baseMonthly: grossMonthly,
          calcSalary: r.calcSalary,
          requiredWarning,
          warningGiven,
          warningIsValid,
          monthsComp: r.compensationMonths,
          multiplier: withNotice ? 0.5 : 1.0,
          finalAmount: r.amount,
        };
      });
  }
}
