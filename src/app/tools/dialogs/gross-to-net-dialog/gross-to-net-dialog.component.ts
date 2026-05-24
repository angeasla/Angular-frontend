import { Component, OnInit, OnDestroy } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
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

  constructor(private fb: FormBuilder) {}

  ngOnInit(): void {
    this.form = this.fb.group({
      calculationMode: ['grossToNet'],
      salaryInput: [880, Validators.required],
      children: [0, Validators.required],
      use14months: [true],
      hasDisability: [false],
    });

    this.calculate();

    this.form.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => this.calculate());
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  get isGrossToNet(): boolean {
    return this.form?.value.calculationMode === 'grossToNet';
  }

  private calculate(): void {
    const vals = this.form.value;
    const mode = vals.calculationMode;
    const amount = parseFloat(vals.salaryInput) || 0;
    const kids = parseInt(vals.children) || 0;

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

    if (mode === 'grossToNet') {
      this.results = this.calculateFromGross(amount, kids, vals.use14months, vals.hasDisability);
    } else {
      this.results = this.findGrossFromNet(amount, kids, vals.use14months, vals.hasDisability);
    }
  }

  private calculateFromGross(monthlyGross: number, children: number, use14months: boolean, hasDisability: boolean): CalcResults {
    const salaryMult = use14months ? 14 : 12;
    const EFKA_EMPLOYEE_RATE = 0.1337;
    const EFKA_EMPLOYER_RATE = 0.2229;

    const monthlyEfkaEmployee = monthlyGross * EFKA_EMPLOYEE_RATE;
    const annualGross = monthlyGross * salaryMult;
    const annualEfka = monthlyEfkaEmployee * salaryMult;
    const taxableIncome = Math.max(0, annualGross - annualEfka);

    let bracketTax = 0;
    let prev = 0;
    for (const b of [
      { l: 10000, r: 0.09 },
      { l: 20000, r: 0.22 },
      { l: 30000, r: 0.28 },
      { l: 40000, r: 0.36 },
      { l: Infinity, r: 0.44 },
    ]) {
      if (taxableIncome <= prev) break;
      bracketTax += (Math.min(taxableIncome, b.l) - prev) * b.r;
      prev = b.l;
    }

    const bases = [777, 900, 1120, 1340]; // 2024 values
    const base = children >= 3 ? bases[3] : (bases[children] ?? bases[0]);
    const reduction = Math.max(0, (annualGross - 12000) * 0.005);
    const disabilityBonus = hasDisability ? 200 : 0;
    const credit = Math.max(0, base - reduction) + disabilityBonus;
    const annualTax = Math.max(0, bracketTax - credit);
    const monthlyTax = annualTax / salaryMult;
    const net = monthlyGross - monthlyEfkaEmployee - monthlyTax;
    const efkaEr = monthlyGross * EFKA_EMPLOYER_RATE;

    return {
      monthlyGross,
      monthlyNet: net,
      efkaEmployee: monthlyEfkaEmployee,
      monthlyTax,
      efkaEmployer: efkaEr,
      totalEmployerCost: monthlyGross + efkaEr,
    };
  }

  private findGrossFromNet(targetNet: number, children: number, use14months: boolean, hasDisability: boolean): CalcResults {
    let low = targetNet;
    let high = targetNet * 3;
    let bestGross = targetNet;

    for (let i = 0; i < 60; i++) {
      const mid = (low + high) / 2;
      const res = this.calculateFromGross(mid, children, use14months, hasDisability);
      if (res.monthlyNet > targetNet) {
        high = mid;
      } else {
        low = mid;
      }
      bestGross = mid;
    }

    return this.calculateFromGross(bestGross, children, use14months, hasDisability);
  }
}
