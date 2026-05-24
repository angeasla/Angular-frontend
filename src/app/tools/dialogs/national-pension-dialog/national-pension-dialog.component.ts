import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule, CurrencyPipe } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { MatDialogModule } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { TranslateModule } from '@ngx-translate/core';

@Component({
  selector: 'app-national-pension-dialog',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatDialogModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    CurrencyPipe,
    TranslateModule,
  ],
  templateUrl: './national-pension-dialog.component.html',
  styleUrls: ['./national-pension-dialog.component.scss'],
})
export class NationalPensionDialogComponent implements OnInit, OnDestroy {
  form: FormGroup;
  results: any = null;
  private destroy$ = new Subject<void>();

  // 2026 Base National Pension Amount
  readonly BASE_PENSION_2026 = 446.86;

  constructor(private fb: FormBuilder) {
    this.form = this.fb.group({
      yearsOfInsurance: [20, [Validators.required, Validators.min(15), Validators.max(50)]],
      residenceYears: [40, [Validators.required, Validators.min(15), Validators.max(40)]],
      age: [62, [Validators.required, Validators.min(62)]],
    });
  }

  ngOnInit() {
    this.calculate();
    this.form.valueChanges.pipe(takeUntil(this.destroy$)).subscribe(() => this.calculate());
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private calculate() {
    const vals = this.form.value;
    const years = parseFloat(vals.yearsOfInsurance) || 0;
    const residence = parseFloat(vals.residenceYears) || 0;
    const age = parseFloat(vals.age) || 0;

    if (years < 15 || residence < 15 || age < 62) {
      this.results = null;
      return;
    }

    let currentAmount = this.BASE_PENSION_2026;
    const breakdown: { label: string; value: string }[] = [];

    // 1. Residence Reduction (< 40 years)
    if (residence < 40) {
      const residenceRatio = residence / 40;
      currentAmount = currentAmount * residenceRatio;
      breakdown.push({
        label: `Μείωση λόγω διαμονής (${residence} από 40 έτη)`,
        value: `-${((1 - residenceRatio) * 100).toFixed(1)}%`,
      });
    }

    // 2. Insurance Years Reduction (< 20 years)
    if (years < 20) {
      const missingYears = 20 - years;
      const reduction = missingYears * 0.02; // 2% per missing year
      currentAmount = currentAmount * (1 - reduction);
      breakdown.push({
        label: `Μείωση λόγω ετών ασφάλισης (${years} έτη)`,
        value: `-${(reduction * 100).toFixed(1)}%`,
      });
    }

    // 3. Early Retirement Penalty (Automated Law)
    // If age is less than 67 AND insurance years are less than 40 -> Penalty applies.
    if (age < 67 && years < 40) {
      const missingAge = 67 - age;
      const reduction = Math.min(missingAge * 0.06, 0.30); // Max 30% reduction (5 years * 6%)
      currentAmount = currentAmount * (1 - reduction);
      breakdown.push({
        label: `Μείωση πρόωρης (Ηλικία ${age} με κάτω από 40 έτη ασφάλισης)`,
        value: `-${(reduction * 100).toFixed(1)}%`,
      });
    }

    this.results = {
      baseAmount: this.BASE_PENSION_2026,
      finalAmount: currentAmount,
      isFull: breakdown.length === 0,
      breakdown: breakdown,
    };
  }
}
