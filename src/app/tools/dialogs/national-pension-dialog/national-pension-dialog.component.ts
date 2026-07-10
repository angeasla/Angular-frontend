import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule, CurrencyPipe } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { Subject } from 'rxjs';
import { debounceTime, takeUntil } from 'rxjs/operators';
import { MatDialogModule } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { TranslateModule } from '@ngx-translate/core';
import { CalculatorService } from '../../../services/calculator.service';

// NOTE: The backend returns only monthlyAmount + reduced (boolean). The per-reduction breakdown
// table shown in the template (residence %, insurance years %, early retirement %) is NOT
// returned by the backend. Decision: the breakdown rows are kept as client-side EXPLANATORY
// display derived from the same legislative rules, but the authoritative finalAmount always
// comes from the backend. If the backend formula diverges, the breakdown labels will be
// approximate — this is acceptable for user education purposes and is clearly labelled.
// Flag: consider asking backend to include a reductions array in a future API version.

interface ReductionRow { label: string; value: string; }

interface NationalPensionResults {
  baseAmount: number;
  finalAmount: number;
  isFull: boolean;
  breakdown: ReductionRow[];
}

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
  results: NationalPensionResults | null = null;
  private destroy$ = new Subject<void>();

  // 2026 Base National Pension Amount (kept for explanatory breakdown display only)
  readonly BASE_PENSION_2026 = 446.86;

  constructor(private fb: FormBuilder, private calc: CalculatorService) {
    this.form = this.fb.group({
      yearsOfInsurance: [20, [Validators.required, Validators.min(15), Validators.max(50)]],
      residenceYears: [40, [Validators.required, Validators.min(15), Validators.max(40)]],
      age: [62, [Validators.required, Validators.min(62)]],
    });
  }

  ngOnInit() {
    this.triggerCalculation();
    this.form.valueChanges
      .pipe(debounceTime(300), takeUntil(this.destroy$))
      .subscribe(() => this.triggerCalculation());
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }

  /**
   * Builds the explanatory breakdown rows for template display.
   * These are labelled reductions derived from the same legal rules as the backend,
   * but the authoritative final amount always comes from the API response.
   */
  private buildBreakdown(years: number, residence: number, age: number): ReductionRow[] {
    const rows: ReductionRow[] = [];

    if (residence < 40) {
      const residenceRatio = residence / 40;
      rows.push({
        label: `Μείωση λόγω διαμονής (${residence} από 40 έτη)`,
        value: `-${((1 - residenceRatio) * 100).toFixed(1)}%`,
      });
    }

    if (years < 20) {
      const reduction = (20 - years) * 0.02;
      rows.push({
        label: `Μείωση λόγω ετών ασφάλισης (${years} έτη)`,
        value: `-${(reduction * 100).toFixed(1)}%`,
      });
    }

    if (age < 67 && years < 40) {
      const reduction = Math.min((67 - age) * 0.06, 0.30);
      rows.push({
        label: `Μείωση πρόωρης (Ηλικία ${age} με κάτω από 40 έτη ασφάλισης)`,
        value: `-${(reduction * 100).toFixed(1)}%`,
      });
    }

    return rows;
  }

  private triggerCalculation(): void {
    const vals = this.form.value;
    const years = parseFloat(vals.yearsOfInsurance) || 0;
    const residence = parseFloat(vals.residenceYears) || 0;
    const age = parseFloat(vals.age) || 0;

    if (years < 15 || residence < 15 || age < 62) {
      this.results = null;
      return;
    }

    this.calc.nationalPension({
      insuranceYears: years,
      residenceYears: residence,
      retirementAge: age,
    })
      .pipe(takeUntil(this.destroy$))
      .subscribe(r => {
        const breakdown = this.buildBreakdown(years, residence, age);
        this.results = {
          baseAmount: this.BASE_PENSION_2026,
          finalAmount: r.monthlyAmount,
          isFull: !r.reduced,
          breakdown,
        };
      });
  }
}
