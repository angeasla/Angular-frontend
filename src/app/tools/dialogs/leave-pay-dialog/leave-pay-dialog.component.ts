import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule, CurrencyPipe } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { MatDialogModule } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { TranslateModule } from '@ngx-translate/core';

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

  constructor(private fb: FormBuilder) {
    // FIX: Initialize in constructor so it's ready before the template renders
    this.form = this.fb.group({
      employeeType: ['salary', Validators.required],
      workweek: [5, Validators.required],
      amount: [920, [Validators.required, Validators.min(1)]],
      leaveDays: [5, [Validators.required, Validators.min(1), Validators.max(30)]],
    });
  }

  ngOnInit(): void {
    this.calculate();

    this.form.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => this.calculate());
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private calculate(): void {
    const vals = this.form.value;
    const amount = parseFloat(vals.amount) || 0;
    const leaveDays = parseFloat(vals.leaveDays) || 0;
    const isSalary = vals.employeeType === 'salary';
    const is5day = parseInt(vals.workweek) === 5;

    if (amount <= 0 || leaveDays <= 0) {
      this.results = null;
      return;
    }

    // Step 1: Paid days calculation (The 1.2 multiplier for 5-day workweeks)
    const multiplier = is5day ? 1.2 : 1;
    const paidDays = leaveDays * multiplier;

    // Step 2 & 3: Leave Pay and Bonus Cap
    let leavePay = 0;
    let bonusCap = 0;

    if (isSalary) {
      leavePay = paidDays * (amount / 25);
      bonusCap = amount / 2;
    } else {
      leavePay = paidDays * amount;
      bonusCap = amount * 13;
    }

    // Leave Bonus equals Leave Pay but cannot exceed the legal cap
    const leaveBonus = Math.min(leavePay, bonusCap);
    const totalPay = leavePay + leaveBonus;
    const capHit = leaveBonus === bonusCap && leavePay > bonusCap;

    this.results = {
      paidDays: paidDays.toFixed(1),
      leavePay,
      leaveBonus,
      totalPay,
      capHit,
      bonusCap,
    };
  }
}
