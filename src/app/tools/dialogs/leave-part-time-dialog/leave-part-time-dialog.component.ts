import { Component, OnInit, OnDestroy } from '@angular/core';
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

interface LeavePartTimeResults {
  baseLeave: number;
  daysWorked: number;
  exactLeave: string;
  finalDays: number;
}

@Component({
  selector: 'app-leave-part-time-dialog',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    MatDialogModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatButtonModule,
    MatIconModule,
    TranslateModule,
  ],
  templateUrl: './leave-part-time-dialog.component.html',
  styleUrl: './leave-part-time-dialog.component.scss',
})
export class LeavePartTimeDialogComponent implements OnInit, OnDestroy {
  form!: FormGroup;
  results: LeavePartTimeResults | null = null;

  private destroy$ = new Subject<void>();

  constructor(private fb: FormBuilder) {}

  ngOnInit(): void {
    this.form = this.fb.group({
      workweek: [5, Validators.required],
      years: [0, [Validators.required, Validators.min(0)]],
      daysWorked: [100, [Validators.required, Validators.min(1), Validators.max(312)]],
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

  private calculate(): void {
    const vals = this.form.value;
    const is6day = parseInt(vals.workweek) === 6;
    const years = parseInt(vals.years) || 0;
    const daysWorked = parseInt(vals.daysWorked) || 0;

    if (daysWorked <= 0) {
      this.results = null;
      return;
    }

    // Determine base leave entitlement based on years of service
    let baseLeave = 0;
    if (years >= 12) {
      baseLeave = is6day ? 30 : 25;
    } else if (years >= 2) {
      baseLeave = is6day ? 26 : 22;
    } else if (years >= 1) {
      baseLeave = is6day ? 25 : 21;
    } else {
      baseLeave = is6day ? 24 : 20;
    }

    // Law: (Days Worked / 25) * (Base Leave / 12)
    const exactLeave = (daysWorked / 25) * (baseLeave / 12);

    // Law rounding: fraction > 0.5 rounds up, <= 0.5 rounds down
    const integerPart = Math.floor(exactLeave);
    const fraction = exactLeave - integerPart;
    const finalDays = fraction > 0.5 ? integerPart + 1 : integerPart;

    this.results = {
      baseLeave,
      daysWorked,
      exactLeave: exactLeave.toFixed(2),
      finalDays,
    };
  }
}
