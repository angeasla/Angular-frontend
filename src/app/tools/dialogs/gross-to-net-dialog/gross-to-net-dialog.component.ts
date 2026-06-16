import { Component, OnInit, OnDestroy } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { Subject } from 'rxjs';
import { debounceTime, switchMap, takeUntil } from 'rxjs/operators';
import { MatDialogModule } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { MatButtonToggleModule } from '@angular/material/button-toggle';
import { MatIconModule } from '@angular/material/icon';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { CurrencyPipe } from '@angular/common';
import { TranslateModule } from '@ngx-translate/core';
import { CalculatorService, GrossToNetResult } from '../../../services/calculator.service';

interface CalcResults {
  monthlyGross: number;
  monthlyNet: number;
  efkaEmployee: number;
  monthlyTax: number;
  efkaEmployer: number;
  totalEmployerCost: number;
}

@Component({
  selector: 'app-gross-to-net-dialog',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    MatDialogModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatButtonModule,
    MatButtonToggleModule,
    MatIconModule,
    MatCheckboxModule,
    CurrencyPipe,
    TranslateModule,
  ],
  templateUrl: './gross-to-net-dialog.component.html',
  styleUrl: './gross-to-net-dialog.component.scss',
})
export class GrossToNetDialogComponent implements OnInit, OnDestroy {
  form!: FormGroup;
  results: CalcResults = {
    monthlyGross: 0,
    monthlyNet: 0,
    efkaEmployee: 0,
    monthlyTax: 0,
    efkaEmployer: 0,
    totalEmployerCost: 0,
  };

  private destroy$ = new Subject<void>();

  constructor(private fb: FormBuilder, private calc: CalculatorService) {}

  ngOnInit(): void {
    this.form = this.fb.group({
      calculationMode: ['grossToNet'],
      salaryInput: [880, Validators.required],
      children: [0, Validators.required],
      age: [40],
      use14months: [true],
      hasDisability: [false],
    });

    // Trigger initial calculation
    this.triggerCalculation();

    this.form.valueChanges
      .pipe(
        debounceTime(300),
        takeUntil(this.destroy$),
      )
      .subscribe(() => this.triggerCalculation());
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  get isGrossToNet(): boolean {
    return this.form?.value.calculationMode === 'grossToNet';
  }

  private triggerCalculation(): void {
    const vals = this.form.value;
    const amount = parseFloat(vals.salaryInput) || 0;
    const children = parseInt(vals.children) || 0;
    const months = vals.use14months ? 14 : 12;
    const disability: boolean = !!vals.hasDisability;
    const age = parseInt(vals.age) || 40;

    if (amount <= 0) {
      this.results = {
        monthlyGross: 0,
        monthlyNet: 0,
        efkaEmployee: 0,
        monthlyTax: 0,
        efkaEmployer: 0,
        totalEmployerCost: 0,
      };
      return;
    }

    if (vals.calculationMode === 'grossToNet') {
      this.calc.grossToNet({ gross: amount, children, months, disability, age })
        .pipe(takeUntil(this.destroy$))
        .subscribe(r => this.mapGrossToNetResult(amount, r));
    } else {
      // net-to-gross: first resolve the gross, then get the full breakdown
      this.calc.netToGross({ net: amount, children, months, disability, age })
        .pipe(
          switchMap(grossResult =>
            this.calc.grossToNet({ gross: grossResult.gross, children, months, disability, age })
              .pipe(
                // carry grossResult along for monthlyGross
                takeUntil(this.destroy$),
              )
          ),
          takeUntil(this.destroy$),
        )
        .subscribe(r => {
          // grossToNet response gives us net back; we need gross from it indirectly.
          // Derive gross: netMonthly + efkaEmployee + incomeTaxMonthly
          const derivedGross = r.netMonthly + r.efkaEmployee + r.incomeTaxMonthly;
          this.results = {
            monthlyGross: derivedGross,
            monthlyNet: r.netMonthly,
            efkaEmployee: r.efkaEmployee,
            monthlyTax: r.incomeTaxMonthly,
            efkaEmployer: r.efkaEmployer,
            totalEmployerCost: r.employerCost,
          };
        });
    }
  }

  private mapGrossToNetResult(gross: number, r: GrossToNetResult): void {
    this.results = {
      monthlyGross: gross,
      monthlyNet: r.netMonthly,
      efkaEmployee: r.efkaEmployee,
      monthlyTax: r.incomeTaxMonthly,
      efkaEmployer: r.efkaEmployer,
      totalEmployerCost: r.employerCost,
    };
  }
}
