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
  results: any = null;
  private destroy$ = new Subject<void>();

  constructor(private fb: FormBuilder) {
    this.form = this.fb.group({
      pensionableEarnings: [1200, [Validators.required, Validators.min(1)]],
      yearsOfInsurance: [20, [Validators.required, Validators.min(15), Validators.max(50)]],
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
    const earnings = parseFloat(vals.pensionableEarnings) || 0;
    const totalYears = parseFloat(vals.yearsOfInsurance) || 0;

    if (earnings <= 0 || totalYears < 15) {
      this.results = null;
      return;
    }

    // Law 4670/2020 (Vroutsis) Progressive Replacement Rate Calculator
    let rate = 0;
    let y = totalYears;

    if (y > 40) { rate += (y - 40) * 0.50; y = 40; }
    if (y > 36) { rate += (y - 36) * 2.55; y = 36; }
    if (y > 33) { rate += (y - 33) * 2.50; y = 33; }
    if (y > 30) { rate += (y - 30) * 1.98; y = 30; }
    if (y > 27) { rate += (y - 27) * 1.21; y = 27; }
    if (y > 24) { rate += (y - 24) * 1.03; y = 24; }
    if (y > 21) { rate += (y - 21) * 0.96; y = 21; }
    if (y > 18) { rate += (y - 18) * 0.90; y = 18; }
    if (y > 15) { rate += (y - 15) * 0.84; y = 15; }
    if (y > 0)  { rate += y * 0.77; }

    const finalAmount = earnings * (rate / 100);

    this.results = {
      earnings,
      replacementRate: rate.toFixed(2),
      finalAmount,
    };
  }
}
