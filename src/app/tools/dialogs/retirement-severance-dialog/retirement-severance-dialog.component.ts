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
import { MatDatepickerModule } from '@angular/material/datepicker';
import { provideNativeDateAdapter, MAT_DATE_LOCALE } from '@angular/material/core';
import { TranslateModule } from '@ngx-translate/core';
import { CalculatorService, RetirementSeveranceResult, RetirementRegime } from '../../../services/calculator.service';
import { toISODate } from '../../../services/date-utils';

@Component({
  selector: 'app-retirement-severance-dialog',
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
    MatDatepickerModule,
    CurrencyPipe,
    TranslateModule,
  ],
  providers: [
    provideNativeDateAdapter(),
    { provide: MAT_DATE_LOCALE, useValue: 'el-GR' },
  ],
  templateUrl: './retirement-severance-dialog.component.html',
  styleUrl: './retirement-severance-dialog.component.scss',
})
export class RetirementSeveranceDialogComponent implements OnInit, OnDestroy {
  form: FormGroup;
  results: RetirementSeveranceResult | null = null;

  /** Cutoff between old (Ν. 2112/1920) and new (Ν. 3863/2010) regimes. */
  private readonly REGIME_CUTOFF = new Date(2010, 5, 17); // 2010-06-17

  private destroy$ = new Subject<void>();

  constructor(private fb: FormBuilder, private calc: CalculatorService) {
    const fiveYearsAgo = new Date();
    fiveYearsAgo.setFullYear(fiveYearsAgo.getFullYear() - 5);

    this.form = this.fb.group({
      hireDate: [fiveYearsAgo, Validators.required],
      regime: ['NEW' as RetirementRegime, Validators.required],
      monthlySalary: [830, [Validators.required, Validators.min(1)]],
    });
  }

  ngOnInit(): void {
    this.triggerCalculation();

    // Auto-set regime from the hire date (user can still override the select afterwards).
    this.form.get('hireDate')!.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe((d: Date | null) => {
        if (!d) { return; }
        const regime: RetirementRegime = new Date(d) <= this.REGIME_CUTOFF ? 'OLD' : 'NEW';
        this.form.get('regime')!.setValue(regime, { emitEvent: true });
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
    const vals = this.form.value;
    const monthlySalary = parseFloat(vals.monthlySalary) || 0;
    const hire = vals.hireDate ? new Date(vals.hireDate) : null;
    const regime: RetirementRegime = vals.regime;

    if (monthlySalary <= 0 || !hire) { this.results = null; return; }

    this.calc.retirementSeverance({ monthlySalary, hireDate: toISODate(hire), regime })
      .pipe(takeUntil(this.destroy$))
      .subscribe(r => {
        this.results = r;
      });
  }
}
