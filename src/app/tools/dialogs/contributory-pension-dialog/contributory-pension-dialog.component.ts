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

@Component({
  selector: 'app-contributory-pension-dialog',
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
  templateUrl: './contributory-pension-dialog.component.html',
  styleUrls: ['./contributory-pension-dialog.component.scss'],
})
export class ContributoryPensionDialogComponent implements OnInit, OnDestroy {
  form: FormGroup;
  results: { earnings: number; replacementRate: string; finalAmount: number } | null = null;
  private destroy$ = new Subject<void>();

  constructor(private fb: FormBuilder, private calc: CalculatorService) {
    this.form = this.fb.group({
      pensionableEarnings: [1200, [Validators.required, Validators.min(1)]],
      yearsOfInsurance: [20, [Validators.required, Validators.min(15), Validators.max(50)]],
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

  private triggerCalculation(): void {
    const vals = this.form.value;
    const earnings = parseFloat(vals.pensionableEarnings) || 0;
    const totalYears = parseFloat(vals.yearsOfInsurance) || 0;

    if (earnings <= 0 || totalYears < 15) {
      this.results = null;
      return;
    }

    this.calc.contributoryPension({ pensionableEarnings: earnings, insuranceYears: totalYears })
      .pipe(takeUntil(this.destroy$))
      .subscribe(r => {
        this.results = {
          earnings,
          replacementRate: r.replacementRatePct.toFixed(2),
          finalAmount: r.monthlyAmount,
        };
      });
  }
}
