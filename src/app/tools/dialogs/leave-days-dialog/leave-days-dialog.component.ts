import { Component, OnInit, OnDestroy, Injectable } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { MatDialogModule } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { NativeDateAdapter, DateAdapter, MAT_DATE_FORMATS, MAT_DATE_LOCALE } from '@angular/material/core';
import { TranslateModule } from '@ngx-translate/core';

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

  constructor(private fb: FormBuilder) {}

  ngOnInit(): void {
    this.form = this.fb.group({
      workweek: [5, Validators.required],
      hireDate: [new Date(), Validators.required],
      totalYears: [0, [Validators.required, Validators.min(0)]],
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

  private monthsBetween(hireDate: Date, refDate: Date) {
    let years = refDate.getFullYear() - hireDate.getFullYear();
    let months = refDate.getMonth() - hireDate.getMonth();
    if (refDate.getDate() < hireDate.getDate()) months -= 1;
    if (months < 0) { years -= 1; months += 12; }
    return { years, months, totalMonths: years * 12 + months };
  }

  private calculate(): void {
    const vals = this.form.value;
    if (!vals.hireDate) { this.results = null; return; }

    const hire = new Date(vals.hireDate);
    const now = new Date(new Date().toISOString().slice(0, 10));
    const is6day = parseInt(vals.workweek) === 6;
    const totYears = parseInt(vals.totalYears) || 0;

    if (hire > now) {
      this.results = { days: 0, detail: 'Η ημερομηνία πρόσληψης είναι στο μέλλον.', tenureDisplay: '' };
      return;
    }

    const { years: empYears, months: empMons, totalMonths: empMonths } = this.monthsBetween(hire, now);

    let days = 0;
    let detail = '';

    const isMaxScale = (empMonths >= 120 || totYears >= 12);

    let entitlement = 0;
    if (isMaxScale) {
      entitlement = is6day ? 30 : 25;
    } else if (empMonths >= 24) {
      entitlement = is6day ? 26 : 22;
    } else if (empMonths >= 12) {
      entitlement = is6day ? 25 : 21;
    } else {
      entitlement = is6day ? 24 : 20;
    }

    if (empMonths < 12) {
      days = Math.max(0, Math.round((empMonths / 12) * entitlement));
      detail = `Αναλογικά για ${empMonths} μήνα/ες απασχόλησης. Βάση ${entitlement} ημέρες/έτος.`;
    } else {
      days = entitlement;
      detail = isMaxScale
        ? 'Ανώτατη κλίμακα λόγω συνολικής προϋπηρεσίας.'
        : `${empYears} έτος/έτη στον ίδιο εργοδότη.`;
    }

    const tenureParts: string[] = [];
    if (empYears === 1) tenureParts.push('1 χρόνος');
    else if (empYears > 1) tenureParts.push(`${empYears} χρόνια`);
    if (empMons === 1) tenureParts.push('1 μήνας');
    else if (empMons > 1) tenureParts.push(`${empMons} μήνες`);
    const tenureDisplay = tenureParts.length === 0 ? 'λιγότερο από 1 μήνας' : tenureParts.join(' και ');

    this.results = { days, detail, tenureDisplay };
  }
}
