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
import { MatCheckboxModule } from '@angular/material/checkbox';
import { TranslateModule } from '@ngx-translate/core';
import { CalculatorService } from '../../../services/calculator.service';

// NOTE: The backend computes the legal hourly rate as salary × 0.006 (ωρομίσθιο), which does NOT depend
// on the contractual hoursPerWeek. The hoursPerWeek form field is therefore not forwarded to the API.
// It remains in the form (and template) for display continuity but is unused by the calculation.
// Flag for future UX cleanup: consider hiding/removing hoursPerWeek or adding an explanatory hint.

interface OvertimeResults {
  hourlyRate: number;
  overworkRate: number;
  legalOvertime: number;
  legalOvertimeOver150: number;
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

  constructor(private fb: FormBuilder, private calc: CalculatorService) {
    this.form = this.fb.group({
      employeeType: ['salary', Validators.required],
      grossAmount: [1200, [Validators.required, Validators.min(1)]],
      hoursPerWeek: [40, [Validators.required, Validators.min(1), Validators.max(40)]],
      isBasicSalary: [false],
      legalBaseAmount: [830, [Validators.required, Validators.min(1)]],
    });
  }

  ngOnInit(): void {
    this.triggerCalculation();

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
      .pipe(debounceTime(300), takeUntil(this.destroy$))
      .subscribe(() => this.triggerCalculation());
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private triggerCalculation(): void {
    const vals = this.form.getRawValue();
    const grossAmount = parseFloat(vals.grossAmount) || 0;
    const legalBaseAmount = parseFloat(vals.legalBaseAmount) || grossAmount;
    const isSalary = vals.employeeType === 'salary';

    if (grossAmount <= 0) { this.results = null; return; }

    // For daily-wage employees convert to a monthly equivalent (×22) before calling the API
    const monthlySalary = isSalary ? grossAmount : grossAmount * 22;
    const legalMonthlySalary = vals.isBasicSalary
      ? monthlySalary
      : (isSalary ? legalBaseAmount : legalBaseAmount * 22);

    this.calc.overtimeRates({
      monthlySalary,
      hourlyWage: 0,
      legalMonthlySalary,
      sixDay: false,
    })
      .pipe(takeUntil(this.destroy$))
      .subscribe(r => {
        this.results = {
          hourlyRate: r.hourlyRate,
          overworkRate: r.overwork,
          legalOvertime: r.legalOvertime,
          legalOvertimeOver150: r.legalOvertimeOver150,
          illegalOvertime: r.illegalOvertime,
          nightShiftIncrement: r.nightIncrement,
          totalNightRate: r.totalNightRate,
          sixthDayStandard: r.sixthDayStandard,
          sixthDayShift: r.sixthDayShift,
        };
      });
  }
}
