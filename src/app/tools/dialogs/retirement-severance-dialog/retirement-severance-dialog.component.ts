import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule, CurrencyPipe } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { Subject } from 'rxjs';
import { debounceTime, takeUntil } from 'rxjs/operators';
import { MatDialogModule } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { TranslateModule } from '@ngx-translate/core';
import { CalculatorService, RetirementSeveranceResult } from '../../../services/calculator.service';

@Component({
  selector: 'app-retirement-severance-dialog',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatDialogModule,
    MatFormFieldModule,
    MatInputModule,
    MatCheckboxModule,
    MatButtonModule,
    MatIconModule,
    CurrencyPipe,
    TranslateModule,
  ],
  templateUrl: './retirement-severance-dialog.component.html',
  styleUrl: './retirement-severance-dialog.component.scss',
})
export class RetirementSeveranceDialogComponent implements OnInit, OnDestroy {
  form: FormGroup;
  results: RetirementSeveranceResult | null = null;

  private destroy$ = new Subject<void>();

  constructor(private fb: FormBuilder, private calc: CalculatorService) {
    this.form = this.fb.group({
      completedYears: [10, [Validators.required, Validators.min(0)]],
      supplementaryInsured: [true],
      monthlySalary: [830, [Validators.required, Validators.min(1)]],
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
    const monthlySalary = parseFloat(vals.monthlySalary) || 0;
    const completedYears = parseInt(vals.completedYears) || 0;
    const supplementaryInsured = !!vals.supplementaryInsured;

    if (monthlySalary <= 0) { this.results = null; return; }

    this.calc.retirementSeverance({ monthlySalary, completedYears, supplementaryInsured })
      .pipe(takeUntil(this.destroy$))
      .subscribe(r => {
        this.results = r;
      });
  }
}
