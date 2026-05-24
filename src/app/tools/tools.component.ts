import { Component, OnInit, OnDestroy } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { Subject } from 'rxjs';
import { takeUntil, filter } from 'rxjs/operators';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { TranslateModule } from '@ngx-translate/core';
import { LayoutService } from '../services/layout.service';
import { GrossToNetDialogComponent } from './dialogs/gross-to-net-dialog/gross-to-net-dialog.component';
import { LeaveDaysDialogComponent } from './dialogs/leave-days-dialog/leave-days-dialog.component';
import { LeavePartTimeDialogComponent } from './dialogs/leave-part-time-dialog/leave-part-time-dialog.component';
import { LeavePayDialogComponent } from './dialogs/leave-pay-dialog/leave-pay-dialog.component';
import { DismissalDialogComponent } from './dialogs/dismissal-dialog/dismissal-dialog.component';
import { OvertimeDialogComponent } from './dialogs/overtime-dialog/overtime-dialog.component';
import { EasterBonusDialogComponent } from './dialogs/easter-bonus-dialog/easter-bonus-dialog.component';
import { EasterPartTimeDialogComponent } from './dialogs/easter-part-time-dialog/easter-part-time-dialog.component';
import { EasterHourlyDialogComponent } from './dialogs/easter-hourly-dialog/easter-hourly-dialog.component';
import { ChristmasBonusDialogComponent } from './dialogs/christmas-bonus-dialog/christmas-bonus-dialog.component';
import { ChristmasPartTimeDialogComponent } from './dialogs/christmas-part-time-dialog/christmas-part-time-dialog.component';
import { ChristmasHourlyDialogComponent } from './dialogs/christmas-hourly-dialog/christmas-hourly-dialog.component';
import { MaternityLeaveDialogComponent } from './dialogs/maternity-leave-dialog/maternity-leave-dialog.component';
import { NationalPensionDialogComponent } from './dialogs/national-pension-dialog/national-pension-dialog.component';
import { ContributoryPensionDialogComponent } from './dialogs/contributory-pension-dialog/contributory-pension-dialog.component';

@Component({
  selector: 'app-tools',
  standalone: true,
  imports: [
    MatCardModule,
    MatIconModule,
    MatDialogModule,
    TranslateModule,
  ],
  templateUrl: './tools.component.html',
  styleUrl: './tools.component.scss',
})
export class ToolsComponent implements OnInit, OnDestroy {
  private destroy$ = new Subject<void>();
  toolCategories = [
    {
      title: 'Μισθός',
      tools: [
        { name: 'Υπολογισμός Καθαρού / Μικτού Μισθού', icon: 'account_balance_wallet', componentKey: 'salary' },
      ],
    },
    {
      title: 'Άδειες',
      tools: [
        { name: 'Υπολογισμός ημερών αδείας', icon: 'event', componentKey: 'leave-days' },
        { name: 'Ημέρες αδείας (εκ περιτροπής)', icon: 'event_repeat', componentKey: 'leave-part-time' },
        { name: 'Αποδοχές και επίδομα αδείας', icon: 'payments', componentKey: 'leave-pay' },
      ],
    },
    {
      title: 'Αποζημιώσεις & Προσαυξήσεις',
      tools: [
        { name: 'Αποζημίωση Απόλυσης', icon: 'work_off', componentKey: 'severance' },
        { name: 'Ωρομίσθιο, Νυχτερινή, Υπερωρία, 6η Ημέρα', icon: 'schedule', componentKey: 'overtime' },
      ],
    },
    {
      title: 'Δώρο Πάσχα',
      tools: [
        { name: 'Υπολογισμός Δώρου Πάσχα', icon: 'redeem', componentKey: 'easter-bonus' },
        { name: 'Δώρο Πάσχα (εκ περιτροπής)', icon: 'redeem', componentKey: 'easter-part-time' },
        { name: 'Δώρο Πάσχα σε Ωρομίσθιους', icon: 'redeem', componentKey: 'easter-hourly' },
      ],
    },
    {
      title: 'Δώρο Χριστουγέννων',
      tools: [
        { name: 'Υπολογισμός Δώρου Χριστουγέννων', icon: 'card_giftcard', componentKey: 'xmas-bonus' },
        { name: 'Δώρο Χριστουγέννων (εκ περιτροπής)', icon: 'card_giftcard', componentKey: 'xmas-part-time' },
        { name: 'Δώρο Χριστουγέννων σε Ωρομίσθιους', icon: 'card_giftcard', componentKey: 'xmas-hourly' },
      ],
    },
    {
      title: 'Μητρότητα & Συντάξεις',
      tools: [
        { name: 'Μητρότητα - Μειωμένο Ωράριο', icon: 'child_care', componentKey: 'maternity' },
        { name: 'Υπολογισμός Εθνικής Σύνταξης', icon: 'account_balance', componentKey: 'national-pension' },
        { name: 'Υπολογισμός Ανταποδοτικής Σύνταξης', icon: 'timeline', componentKey: 'contributory-pension' },
      ],
    },
  ];

  constructor(
    private layoutService: LayoutService,
    private dialog: MatDialog,
    private route: ActivatedRoute,
  ) {}

  ngOnInit(): void {
    this.layoutService.showSidenav();

    // Listen to URL fragment changes from sidebar links and open the corresponding tool
    this.route.fragment.pipe(
      takeUntil(this.destroy$),
      filter((f): f is string => !!f),
    ).subscribe(fragment => {
      this.openTool(fragment);
    });

    // Listen to tool open requests from sidebar (via LayoutService)
    this.layoutService.openTool$.pipe(
      takeUntil(this.destroy$),
    ).subscribe(key => {
      this.openTool(key);
    });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  // Registry mapping tool keys to their dialog components and config
  private readonly toolRegistry: Record<string, { component: any; maxWidth?: string }> = {
    'salary': { component: GrossToNetDialogComponent },
    'leave-days': { component: LeaveDaysDialogComponent, maxWidth: '500px' },
    'leave-part-time': { component: LeavePartTimeDialogComponent },
    'leave-pay': { component: LeavePayDialogComponent },
    'severance': { component: DismissalDialogComponent },
    'overtime': { component: OvertimeDialogComponent },
    'easter-bonus': { component: EasterBonusDialogComponent },
    'easter-part-time': { component: EasterPartTimeDialogComponent },
    'easter-hourly': { component: EasterHourlyDialogComponent },
    'xmas-bonus': { component: ChristmasBonusDialogComponent },
    'xmas-part-time': { component: ChristmasPartTimeDialogComponent },
    'xmas-hourly': { component: ChristmasHourlyDialogComponent },
    'maternity': { component: MaternityLeaveDialogComponent },
    'national-pension': { component: NationalPensionDialogComponent },
    'contributory-pension': { component: ContributoryPensionDialogComponent },
  };

  openTool(key: string): void {
    const entry = this.toolRegistry[key];
    if (entry) {
      this.dialog.open(entry.component, {
        width: '95vw',
        maxWidth: entry.maxWidth || '600px',
        panelClass: 'tool-dialog',
      });
    }
  }
}
