import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { Subject } from 'rxjs';
import { debounceTime, takeUntil } from 'rxjs/operators';
import { MatDialogModule } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { provideNativeDateAdapter, MAT_DATE_LOCALE } from '@angular/material/core';
import { TranslateModule } from '@ngx-translate/core';
import { CalculatorService } from '../../../services/calculator.service';
import { toISODate } from '../../../services/date-utils';

interface MaternityResults {
  endDate: Date;
  workingDaysCount: number;
  expectedLeaveDays: number;
  totalHoursOwed: string;
  continuousDays: string;
  continuousMonths: string;
}

@Component({
  selector: 'app-maternity-leave-dialog',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatDialogModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatButtonModule,
    MatDatepickerModule,
    TranslateModule,
  ],
  providers: [
    provideNativeDateAdapter(),
    { provide: MAT_DATE_LOCALE, useValue: 'el-GR' },
  ],
  templateUrl: './maternity-leave-dialog.component.html',
  styleUrl: './maternity-leave-dialog.component.scss',
})
export class MaternityLeaveDialogComponent implements OnInit, OnDestroy {
  form: FormGroup;
  results: MaternityResults | null = null;

  private destroy$ = new Subject<void>();

  constructor(private fb: FormBuilder, private calc: CalculatorService) {
    this.form = this.fb.group({
      startDate: [new Date(), Validators.required],
      workweek: [5, Validators.required],
      annualLeaveDays: [20, [Validators.required, Validators.min(20), Validators.max(30)]],
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
    const start = vals.startDate ? new Date(vals.startDate) : null;
    const workWeek = parseInt(vals.workweek) || 5;
    const annualLeaveDays = parseInt(vals.annualLeaveDays) || 20;

    if (!start) { this.results = null; return; }

    this.calc.maternity({
      windowStart: toISODate(start),
      workWeek,
      annualLeaveDays,
      multipleBirthExtraChildren: 0,
    })
      .pipe(takeUntil(this.destroy$))
      .subscribe(r => {
        const endDate = new Date(r.windowEnd);
        // expectedLeaveDays = annualLeave * 2.5 years — derive for template display
        const expectedLeaveDays = annualLeaveDays * 2.5;

        this.results = {
          endDate,
          workingDaysCount: r.workingDays,
          expectedLeaveDays,
          totalHoursOwed: r.hoursOwed.toFixed(1),
          continuousDays: r.continuousDays.toFixed(1),
          continuousMonths: r.continuousMonths.toFixed(1),
        };
      });
  }
}
