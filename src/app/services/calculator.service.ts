import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

// ─── Result types (mirror the backend DTOs in calc/) ───────────────────────
export interface GrossToNetResult {
  netMonthly: number; efkaEmployee: number; incomeTaxMonthly: number;
  effectiveTaxRatePct: number; employerCost: number; efkaEmployer: number;
}
export interface GrossResult { gross: number; }
export interface LeaveDaysResult { days: number; }
export interface PartTimeLeaveResult { days: number; exactDays: number; }
export interface LeavePayResult { paidDays: number; leavePay: number; leaveBonus: number; total: number; capHit: boolean; }
export interface SeveranceResult { amount: number; compensationMonths: number; calcSalary: number; noticePeriodMonths: number; withNotice: boolean; }
export interface OvertimeResult { hourlyRate: number; baseAmount: number; surchargeAmount: number; total: number; surchargePct: number; }
export interface OvertimeRatesResult {
  hourlyRate: number; overwork: number; legalOvertime: number; legalOvertimeOver150: number;
  illegalOvertime: number; nightIncrement: number; totalNightRate: number;
  sixthDayStandard: number; sixthDayShift: number;
}
export interface NightWorkResult { hourlyRate: number; baseAmount: number; allowance: number; total: number; surchargePct: number; }
export interface BonusResult { amount: number; base: number; units: number; }
export interface MaternityResult { workingDays: number; hoursOwed: number; continuousDays: number; continuousMonths: number; windowEnd: string; }
export interface NationalPensionResult { monthlyAmount: number; reduced: boolean; }
export interface ContributoryPensionResult { monthlyAmount: number; replacementRatePct: number; }

export type PayType = 'SALARY' | 'DAILY_WAGE';
export type OvertimeType = 'OVERWORK' | 'LEGAL' | 'ILLEGAL';

/**
 * Calls the backend calculator REST API (/api/calc/*). This is the single source of truth for all
 * calculations — the dialogs render what the backend returns instead of computing locally.
 */
@Injectable({ providedIn: 'root' })
export class CalculatorService {
  private base = `${environment.apiBaseUrl}/api/calc`;

  constructor(private http: HttpClient) {}

  private post<T>(path: string, body: unknown): Observable<T> {
    return this.http.post<T>(`${this.base}/${path}`, body);
  }

  grossToNet(b: { gross: number; children: number; months: number; disability: boolean }) {
    return this.post<GrossToNetResult>('gross-to-net', b);
  }
  netToGross(b: { net: number; children: number; months: number; disability: boolean }) {
    return this.post<GrossResult>('net-to-gross', b);
  }
  leaveDays(b: { workWeek: number; tenureMonths: number; totalCareerYears: number }) {
    return this.post<LeaveDaysResult>('leave-days', b);
  }
  leavePartTime(b: { fullTimeDays: number; ptRatio: number }) {
    return this.post<PartTimeLeaveResult>('leave-part-time', b);
  }
  leavePay(b: { payType: PayType; amount: number; leaveDays: number; workWeek: number }) {
    return this.post<LeavePayResult>('leave-pay', b);
  }
  severance(b: { grossMonthly: number; years: number; withNotice: boolean }) {
    return this.post<SeveranceResult>('severance', b);
  }
  overtime(b: { monthlySalary: number; hourlyWage: number; hours: number; type: OvertimeType; sunday: boolean; night: boolean; sixDay: boolean }) {
    return this.post<OvertimeResult>('overtime', b);
  }
  overtimeRates(b: { monthlySalary: number; hourlyWage: number; legalMonthlySalary: number; sixDay: boolean }) {
    return this.post<OvertimeRatesResult>('overtime-rates', b);
  }
  nightWork(b: { monthlySalary: number; hourlyWage: number; hours: number; sundayOrHoliday: boolean; sixDay: boolean }) {
    return this.post<NightWorkResult>('nightwork', b);
  }
  easterBonus(b: { monthlySalary: number; workedDays: number }) {
    return this.post<BonusResult>('easter-bonus', b);
  }
  easterPartTime(b: { dailyWage: number; workedDays: number }) {
    return this.post<BonusResult>('easter-part-time', b);
  }
  easterHourly(b: { totalEarnings: number; actualDaysWorked: number; calendarDays: number }) {
    return this.post<BonusResult>('easter-hourly', b);
  }
  xmasBonus(b: { monthlySalary: number; workedDays: number }) {
    return this.post<BonusResult>('xmas-bonus', b);
  }
  xmasPartTime(b: { dailyWage: number; workedDays: number }) {
    return this.post<BonusResult>('xmas-part-time', b);
  }
  xmasHourly(b: { totalEarnings: number; actualDaysWorked: number; calendarDays: number }) {
    return this.post<BonusResult>('xmas-hourly', b);
  }
  maternity(b: { windowStart: string; workWeek: number; annualLeaveDays: number; multipleBirthExtraChildren: number }) {
    return this.post<MaternityResult>('maternity', b);
  }
  nationalPension(b: { insuranceYears: number; residenceYears: number; retirementAge: number }) {
    return this.post<NationalPensionResult>('national-pension', b);
  }
  contributoryPension(b: { pensionableEarnings: number; insuranceYears: number }) {
    return this.post<ContributoryPensionResult>('contributory-pension', b);
  }
}
