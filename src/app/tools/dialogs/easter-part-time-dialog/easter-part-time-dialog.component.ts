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
import { TranslateModule } from '@ngx-translate/core';
import { CalculatorService } from '../../../services/calculator.service';

interface EasterPartTimeResults {
  dailyWage: number;
  bonusDaysRatio: string;
  baseBonus: number;
  increment: number;
  finalBonus: number;
}

@Component({
  selector: 'app-easter-part-time-dialog',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatDialogModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatButtonModule,
    CurrencyPipe,
    TranslateModule,
  ],
  templateUrl: './easter-part-time-dialog.component.html',
  styleUrl: './easter-part-time-dialog.component.scss',
})
export class EasterPartTimeDialogComponent implements OnInit, OnDestroy {
  form: FormGroup;
  results: EasterPartTimeResults | null = null;

  private destroy$ = new Subject<void>();

  constructor(private fb: FormBuilder, private calc: CalculatorService) {
    this.form = this.fb.group({
      employeeType: ['salary', Validators.required],
      amount: [600, [Validators.required, Validators.min(1)]],
      daysWorked: [40, [Validators.required, Validators.min(1), Validators.max(120)]],
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
    const daysWorked = parseInt(vals.daysWorked) || 0;
    const isSalary = vals.employeeType === 'salary';

    if (amount <= 0 || daysWorked <= 0) { this.results = null; return; }

    const dailyWage = isSalary ? amount / 25 : amount;

    this.calc.easterPartTime({ dailyWage, workedDays: daysWorked })
      .pipe(takeUntil(this.destroy$))
      .subscribe(r => {
        this.results = {
          dailyWage,
          bonusDaysRatio: r.units.toFixed(2),
          baseBonus: r.base,
          increment: r.amount - r.base,
          finalBonus: r.amount,
        };
      });
  }
}
