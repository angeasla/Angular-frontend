import { Injectable } from '@angular/core';
import { BehaviorSubject, Subject } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class LayoutService {
  private sidenavVisibleSubject = new BehaviorSubject<boolean>(true);
  sidenavVisible$ = this.sidenavVisibleSubject.asObservable();

  private activeMenuSubject = new BehaviorSubject<'tools' | 'wiki'>('tools');
  activeMenu$ = this.activeMenuSubject.asObservable();

  private openToolSubject = new Subject<string>();
  openTool$ = this.openToolSubject.asObservable();

  showSidenav(): void {
    this.sidenavVisibleSubject.next(true);
  }

  hideSidenav(): void {
    this.sidenavVisibleSubject.next(false);
  }

  setMenuContext(context: 'tools' | 'wiki'): void {
    this.activeMenuSubject.next(context);
  }

  requestOpenTool(key: string): void {
    this.openToolSubject.next(key);
  }
}
