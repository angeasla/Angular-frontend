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
import { TranslateModule } from '@ngx-translate/core';

interface ChristmasPartTimeResults {
  dailyWage: number;
  bonusDaysRatio: string;
  baseBonus: number;
  increment: number;
  finalBonus: number;
}

@Component({
  selector: 'app-christmas-part-time-dialog',
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
  templateUrl: './christmas-part-time-dialog.component.html',
  styleUrl: './christmas-part-time-dialog.component.scss',
})
export class ChristmasPartTimeDialogComponent implements OnInit, OnDestroy {
  form: FormGroup;
  results: ChristmasPartTimeResults | null = null;

  private destroy$ = new Subject<void>();

  constructor(private fb: FormBuilder) {
    this.form = this.fb.group({
      employeeType: ['salary', Validators.required],
      amount: [600, [Validators.required, Validators.min(1)]],
      daysWorked: [80, [Validators.required, Validators.min(1), Validators.max(245)]],
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
    const daysWorked = parseInt(vals.daysWorked) || 0;
    const isSalary = vals.employeeType === 'salary';

    if (amount <= 0 || daysWorked <= 0) { this.results = null; return; }

    // 1. Calculate base daily wage
    const dailyWage = isSalary ? (amount / 25) : amount;

    // 2. Legal Ratio for part-time: 1 daily wage for every 8 days WORKED
    const bonusDaysRatio = daysWorked / 8;
    const baseBonus = bonusDaysRatio * dailyWage;

    // 3. Holiday Bonus Increment (0.04166)
    const increment = baseBonus * 0.04166;
    const finalBonus = baseBonus + increment;

    this.results = {
      dailyWage,
      bonusDaysRatio: bonusDaysRatio.toFixed(2),
      baseBonus,
      increment,
      finalBonus,
    };
  }
}
