import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule, CurrencyPipe } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { Subject } from 'rxjs';
import { debounceTime, takeUntil } from 'rxjs/operators';
import { MatDialogModule } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { TranslateModule } from '@ngx-translate/core';
import { CalculatorService, UnemploymentResult } from '../../../services/calculator.service';

@Component({
  selector: 'app-unemployment-dialog',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatDialogModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatIconModule,
    CurrencyPipe,
    TranslateModule,
  ],
  templateUrl: './unemployment-dialog.component.html',
  styleUrl: './unemployment-dialog.component.scss',
})
export class UnemploymentDialogComponent implements OnInit, OnDestroy {
  form: FormGroup;
  results: UnemploymentResult | null = null;

  private destroy$ = new Subject<void>();

  constructor(private fb: FormBuilder, private calc: CalculatorService) {
    this.form = this.fb.group({
      avgMonthlySalary: [830, [Validators.required, Validators.min(1)]],
      insuredDays: [200, [Validators.required, Validators.min(0)]],
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

  /** Maps the backend boundApplied enum to the matching i18n label key. */
  boundLabelKey(): string {
    switch (this.results?.boundApplied) {
      case 'FLOOR': return 'TOOLS.UNEMPLOYMENT_DIALOG.BOUND_FLOOR';
      case 'CAP': return 'TOOLS.UNEMPLOYMENT_DIALOG.BOUND_CAP';
      default: return 'TOOLS.UNEMPLOYMENT_DIALOG.BOUND_SALARY';
    }
  }

  private triggerCalculation(): void {
    const vals = this.form.value;
    const avgMonthlySalary = parseFloat(vals.avgMonthlySalary) || 0;
    const insuredDays = parseInt(vals.insuredDays) || 0;

    if (avgMonthlySalary <= 0) { this.results = null; return; }

    this.calc.unemployment({ avgMonthlySalary, insuredDays })
      .pipe(takeUntil(this.destroy$))
      .subscribe(r => {
        this.results = r;
      });
  }
}
