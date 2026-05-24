import { Component, OnInit, OnDestroy, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterOutlet, RouterLink, RouterLinkActive, NavigationEnd } from '@angular/router';
import { Router } from '@angular/router';
import { Subject } from 'rxjs';
import { filter, takeUntil } from 'rxjs/operators';
import { BreakpointObserver } from '@angular/cdk/layout';
import { MatDrawerMode, MatSidenavModule } from '@angular/material/sidenav';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatListModule } from '@angular/material/list';
import { MatMenuModule } from '@angular/material/menu';
import { MatDividerModule } from '@angular/material/divider';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { LayoutService } from './services/layout.service';
import { WikiService, WikiCategory } from './services/wiki.service';
import { AiChatDialogComponent } from './ai-chat-dialog/ai-chat-dialog.component';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [
    CommonModule,
    RouterOutlet,
    RouterLink,
    RouterLinkActive,
    MatToolbarModule,
    MatSidenavModule,
    MatButtonModule,
    MatIconModule,
    MatListModule,
    MatMenuModule,
    MatDividerModule,
    TranslateModule,
    MatDialogModule,
  ],
  templateUrl: './app.html',
  styleUrl: './app.scss',
})
export class App implements OnInit, OnDestroy {
  isDesktop = signal(false);
  sidenavOpened = signal(false);
  sidenavMode = computed<MatDrawerMode>(() =>
    this.isDesktop() ? 'side' : 'over'
  );
  isSidenavVisible = true;
  activeMenu: 'tools' | 'wiki' = 'tools';
  wikiCategories: WikiCategory[] = [];

  private destroy$ = new Subject<void>();

  constructor(
    private breakpointObserver: BreakpointObserver,
    private translate: TranslateService,
    private router: Router,
    private layoutService: LayoutService,
    private wikiService: WikiService,
    private dialog: MatDialog,
  ) {}

  ngOnInit(): void {
    this.translate.setDefaultLang('el');
    this.translate.use('el');

    this.breakpointObserver
      .observe(['(min-width: 768px)'])
      .pipe(takeUntil(this.destroy$))
      .subscribe(state => {
        this.isDesktop.set(state.matches);
        this.sidenavOpened.set(state.matches);
      });

    this.layoutService.sidenavVisible$
      .pipe(takeUntil(this.destroy$))
      .subscribe(visible => {
        this.isSidenavVisible = visible;
        if (!visible) {
          this.sidenavOpened.set(false);
        } else if (this.isDesktop()) {
          this.sidenavOpened.set(true);
        }
      });

    this.layoutService.activeMenu$
      .pipe(takeUntil(this.destroy$))
      .subscribe(menu => {
        this.activeMenu = menu;
      });

    // Load wiki categories from WikiService
    this.wikiService.categories$
      .pipe(takeUntil(this.destroy$))
      .subscribe(categories => {
        this.wikiCategories = categories;
      });

    // React to route changes to set menu context
    this.router.events.pipe(
      filter(event => event instanceof NavigationEnd),
      takeUntil(this.destroy$)
    ).subscribe((event: any) => {
      
      // Scroll to top on every route change (e.g. navigating to a new article)
      const contentArea = document.querySelector('.sidenav-content');
      if (contentArea) {
        contentArea.scrollTo(0, 0);
      }

      if (event.urlAfterRedirects.startsWith('/wiki')) {
        this.layoutService.setMenuContext('wiki');
      } else if (event.urlAfterRedirects.startsWith('/tools')) {
        this.layoutService.setMenuContext('tools');
      }
    });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  toggleSidenav(): void {
    this.sidenavOpened.update(open => !open);
  }

  closeSidenavOnMobile(): void {
    if (!this.isDesktop()) {
      this.sidenavOpened.set(false);
    }
  }

  openToolFromSidebar(key: string): void {
    this.closeSidenavOnMobile();
    // If already on /tools, just emit the tool key via service
    if (this.router.url.startsWith('/tools')) {
      this.layoutService.requestOpenTool(key);
    } else {
      // Navigate to /tools with fragment; the ToolsComponent will pick it up
      this.router.navigate(['/tools'], { fragment: key });
    }
  }

  navigateToSupport(): void {
    this.dialog.open(AiChatDialogComponent, {
      width: '95vw',
      maxWidth: '700px',
      panelClass: 'chat-dialog-panel',
    });
  }
}
