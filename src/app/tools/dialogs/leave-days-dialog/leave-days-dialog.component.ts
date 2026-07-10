import { Component, OnInit, OnDestroy, Injectable } from '@angular/core';
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
import { NativeDateAdapter, DateAdapter, MAT_DATE_FORMATS, MAT_DATE_LOCALE } from '@angular/material/core';
import { TranslateModule } from '@ngx-translate/core';
import { CalculatorService } from '../../../services/calculator.service';
import { wholeMonthsBetween } from '../../../services/date-utils';

@Injectable()
class CustomDateAdapter extends NativeDateAdapter {
  override parse(value: any): Date | null {
    if (typeof value === 'string' && value.indexOf('/') > -1) {
      const str = value.split('/');
      const day = Number(str[0]);
      const month = Number(str[1]) - 1;
      const year = Number(str[2]);
      if (year > 0 && month >= 0 && month <= 11 && day >= 1 && day <= 31) {
        return new Date(year, month, day);
      }
    }
    return super.parse(value);
  }

  override format(date: Date, displayFormat: Object): string {
    const day = date.getDate().toString().padStart(2, '0');
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const year = date.getFullYear();
    return `${day}/${month}/${year}`;
  }
}

const GREEK_DATE_FORMATS = {
  parse: { dateInput: 'DD/MM/YYYY' },
  display: {
    dateInput: 'DD/MM/YYYY',
    monthYearLabel: 'MMM YYYY',
    dateA11yLabel: 'LL',
    monthYearA11yLabel: 'MMMM YYYY',
  },
};

interface LeaveResults {
  days: number;
  detail: string;
  tenureDisplay: string;
}

@Component({
  selector: 'app-leave-days-dialog',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    MatDialogModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatButtonModule,
    MatIconModule,
    MatDatepickerModule,
    TranslateModule,
  ],
  providers: [
    { provide: DateAdapter, useClass: CustomDateAdapter, deps: [MAT_DATE_LOCALE] },
    { provide: MAT_DATE_FORMATS, useValue: GREEK_DATE_FORMATS },
    { provide: MAT_DATE_LOCALE, useValue: 'el-GR' },
  ],
  templateUrl: './leave-days-dialog.component.html',
  styleUrl: './leave-days-dialog.component.scss',
})
export class LeaveDaysDialogComponent implements OnInit, OnDestroy {
  form!: FormGroup;
  results: LeaveResults | null = null;
  today = new Date();

  private destroy$ = new Subject<void>();

  constructor(private fb: FormBuilder, private calc: CalculatorService) {}

  ngOnInit(): void {
    this.form = this.fb.group({
      workweek: [5, Validators.required],
      hireDate: [new Date(), Validators.required],
      totalYears: [0, [Validators.required, Validators.min(0)]],
    });

    this.triggerCalculation();

    this.form.valueChanges
      .pipe(debounceTime(300), takeUntil(this.destroy$))
      .subscribe(() => this.triggerCalculation());
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private tenureLabel(tenureMonths: number): string {
    const years = Math.floor(tenureMonths / 12);
    const months = tenureMonths % 12;
    const parts: string[] = [];
    if (years === 1) parts.push('1 χρόνος');
    else if (years > 1) parts.push(`${years} χρόνια`);
    if (months === 1) parts.push('1 μήνας');
    else if (months > 1) parts.push(`${months} μήνες`);
    return parts.length === 0 ? 'λιγότερο από 1 μήνας' : parts.join(' και ');
  }

  private triggerCalculation(): void {
    const vals = this.form.value;
    if (!vals.hireDate) { this.results = null; return; }

    const hire = new Date(vals.hireDate);
    const now = new Date(new Date().toISOString().slice(0, 10));

    if (hire > now) {
      this.results = { days: 0, detail: 'Η ημερομηνία πρόσληψης είναι στο μέλλον.', tenureDisplay: '' };
      return;
    }

    const tenureMonths = wholeMonthsBetween(hire, now);
    const workWeek = parseInt(vals.workweek) || 5;
    const totalCareerYears = parseInt(vals.totalYears) || 0;

    this.calc.leaveDays({ workWeek, tenureMonths, totalCareerYears })
      .pipe(takeUntil(this.destroy$))
      .subscribe(r => {
        this.results = {
          days: r.days,
          detail: `Βάσει ${tenureMonths} μήνων απασχόλησης.`,
          tenureDisplay: this.tenureLabel(tenureMonths),
        };
      });
  }
}
