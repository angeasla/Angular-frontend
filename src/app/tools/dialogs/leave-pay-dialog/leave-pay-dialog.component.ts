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
import { TranslateModule } from '@ngx-translate/core';
import { CalculatorService, PayType } from '../../../services/calculator.service';

interface LeavePayResults {
  paidDays: string;
  leavePay: number;
  leaveBonus: number;
  totalPay: number;
  capHit: boolean;
  bonusCap: number;
}

@Component({
  selector: 'app-leave-pay-dialog',
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
    CurrencyPipe,
    TranslateModule,
  ],
  templateUrl: './leave-pay-dialog.component.html',
  styleUrl: './leave-pay-dialog.component.scss',
})
export class LeavePayDialogComponent implements OnInit, OnDestroy {
  form: FormGroup;
  results: LeavePayResults | null = null;

  private destroy$ = new Subject<void>();

  constructor(private fb: FormBuilder, private calc: CalculatorService) {
    this.form = this.fb.group({
      employeeType: ['salary', Validators.required],
      workweek: [5, Validators.required],
      amount: [920, [Validators.required, Validators.min(1)]],
      leaveDays: [5, [Validators.required, Validators.min(1), Validators.max(30)]],
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
    const amount = parseFloat(vals.amount) || 0;
    const leaveDays = parseFloat(vals.leaveDays) || 0;
    const workWeek = parseInt(vals.workweek) || 5;
    const payType: PayType = vals.employeeType === 'salary' ? 'SALARY' : 'DAILY_WAGE';

    if (amount <= 0 || leaveDays <= 0) {
      this.results = null;
      return;
    }

    this.calc.leavePay({ payType, amount, leaveDays, workWeek })
      .pipe(takeUntil(this.destroy$))
      .subscribe(r => {
        // bonusCap is not returned by backend; derive for template display (capHit is authoritative)
        const bonusCap = r.capHit ? r.leaveBonus : 0;
        this.results = {
          paidDays: r.paidDays.toFixed(1),
          leavePay: r.leavePay,
          leaveBonus: r.leaveBonus,
          totalPay: r.total,
          capHit: r.capHit,
          bonusCap,
        };
      });
  }
}
