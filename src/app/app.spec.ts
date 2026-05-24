import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Observable, Subject } from 'rxjs';
import { BreakpointObserver, BreakpointState } from '@angular/cdk/layout';
import { TranslateService, TranslateModule, TranslateLoader } from '@ngx-translate/core';
import { provideRouter, Router } from '@angular/router';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { provideHttpClient } from '@angular/common/http';
import { App } from './app';
import * as fs from 'fs';
import * as path from 'path';

describe('App - Initialization', () => {
  let breakpointSubject: Subject<BreakpointState>;

  function setup(initialMatches: boolean) {
    breakpointSubject = new Subject<BreakpointState>();

    const breakpointObserverMock = {
      observe: () => breakpointSubject.asObservable(),
    };

    TestBed.configureTestingModule({
      imports: [App, TranslateModule.forRoot()],
      providers: [
        provideRouter([]),
        { provide: BreakpointObserver, useValue: breakpointObserverMock },
      ],
    });

    const translateService = TestBed.inject(TranslateService);
    vi.spyOn(translateService, 'setDefaultLang');
    vi.spyOn(translateService, 'use');

    const fixture = TestBed.createComponent(App);
    const component = fixture.componentInstance;

    // Trigger ngOnInit
    fixture.detectChanges();

    // Emit the breakpoint state
    breakpointSubject.next({
      matches: initialMatches,
      breakpoints: { '(min-width: 768px)': initialMatches },
    });

    return { fixture, component, translateService };
  }

  it('should call translate.setDefaultLang("el") on init', () => {
    const { translateService } = setup(false);
    expect(translateService.setDefaultLang).toHaveBeenCalledWith('el');
  });

  it('should call translate.use("el") on init', () => {
    const { translateService } = setup(false);
    expect(translateService.use).toHaveBeenCalledWith('el');
  });

  it('should set sidenavOpened to true and sidenavMode to "side" when BreakpointObserver emits desktop match', () => {
    const { component } = setup(true);
    expect(component.sidenavOpened()).toBe(true);
    expect(component.sidenavMode()).toBe('side');
  });

  it('should set sidenavOpened to false and sidenavMode to "over" when BreakpointObserver emits mobile match', () => {
    const { component } = setup(false);
    expect(component.sidenavOpened()).toBe(false);
    expect(component.sidenavMode()).toBe('over');
  });
});

describe('App - Template Rendering', () => {
  let breakpointSubject: Subject<BreakpointState>;
  let fixture: ComponentFixture<App>;
  let component: App;

  function setup(isDesktop: boolean) {
    breakpointSubject = new Subject<BreakpointState>();

    const breakpointObserverMock = {
      observe: () => breakpointSubject.asObservable(),
    };

    TestBed.configureTestingModule({
      imports: [App, TranslateModule.forRoot(), NoopAnimationsModule],
      providers: [
        provideRouter([]),
        { provide: BreakpointObserver, useValue: breakpointObserverMock },
      ],
    });

    fixture = TestBed.createComponent(App);
    component = fixture.componentInstance;

    // Trigger ngOnInit
    fixture.detectChanges();

    // Emit the breakpoint state
    breakpointSubject.next({
      matches: isDesktop,
      breakpoints: { '(min-width: 768px)': isDesktop },
    });

    fixture.detectChanges();
  }

  describe('Hamburger button (Requirement 5.5)', () => {
    it('should NOT render hamburger button when isDesktop() is true', () => {
      setup(true);
      const hamburger = fixture.nativeElement.querySelector(
        'button[mat-icon-button]'
      );
      expect(hamburger).toBeNull();
    });

    it('should render hamburger button when isDesktop() is false', () => {
      setup(false);
      const hamburger = fixture.nativeElement.querySelector(
        'button[mat-icon-button]'
      );
      expect(hamburger).not.toBeNull();
      const icon = hamburger.querySelector('mat-icon');
      expect(icon?.textContent?.trim()).toBe('menu');
    });
  });

  describe('Desktop nav links (Requirements 5.8, 9.3)', () => {
    it('should render desktop nav links when isDesktop() is true', () => {
      setup(true);
      const nav = fixture.nativeElement.querySelector('nav.desktop-nav');
      expect(nav).not.toBeNull();
      const links = nav.querySelectorAll('a[mat-button]');
      expect(links.length).toBe(3);
    });

    it('should NOT render desktop nav links when isDesktop() is false', () => {
      setup(false);
      const nav = fixture.nativeElement.querySelector('nav.desktop-nav');
      expect(nav).toBeNull();
    });
  });

  describe('mat-toolbar color (Requirement 5.9)', () => {
    it('should have color="primary" on mat-toolbar', () => {
      setup(false);
      const toolbar = fixture.nativeElement.querySelector('mat-toolbar');
      expect(toolbar).not.toBeNull();
      expect(toolbar.getAttribute('color')).toBe('primary');
    });
  });

  describe('FAB button (Requirements 8.3, 8.4, 8.5)', () => {
    it('should have color="accent" on mat-fab', () => {
      setup(false);
      const fab = fixture.nativeElement.querySelector('button[mat-fab]');
      expect(fab).not.toBeNull();
      expect(fab.getAttribute('color')).toBe('accent');
    });

    it('should contain support_agent icon', () => {
      setup(false);
      const fab = fixture.nativeElement.querySelector('button[mat-fab]');
      expect(fab).not.toBeNull();
      const icon = fab.querySelector('mat-icon');
      expect(icon?.textContent?.trim()).toBe('support_agent');
    });

    it('should have aria-label bound to FAB.ARIA_LABEL translation key', () => {
      setup(false);
      const fab = fixture.nativeElement.querySelector('button[mat-fab]');
      expect(fab).not.toBeNull();
      // With TranslateModule.forRoot() and no loaded translations,
      // the raw key is returned as fallback
      expect(fab.getAttribute('aria-label')).toBe('FAB.ARIA_LABEL');
    });
  });

  describe('router-outlet placement (Requirement 7.1)', () => {
    it('should render router-outlet inside mat-sidenav-content', () => {
      setup(false);
      const sidenavContent = fixture.nativeElement.querySelector(
        'mat-sidenav-content'
      );
      expect(sidenavContent).not.toBeNull();
      const routerOutlet = sidenavContent.querySelector('router-outlet');
      expect(routerOutlet).not.toBeNull();
    });
  });
});

describe('App - Interactions', () => {
  let breakpointSubject: Subject<BreakpointState>;

  function setup(initialMatches: boolean) {
    breakpointSubject = new Subject<BreakpointState>();

    const breakpointObserverMock = {
      observe: () => breakpointSubject.asObservable(),
    };

    TestBed.configureTestingModule({
      imports: [App, TranslateModule.forRoot()],
      providers: [
        provideRouter([]),
        { provide: BreakpointObserver, useValue: breakpointObserverMock },
      ],
    });

    const fixture = TestBed.createComponent(App);
    const component = fixture.componentInstance;

    // Trigger ngOnInit
    fixture.detectChanges();

    // Emit the breakpoint state
    breakpointSubject.next({
      matches: initialMatches,
      breakpoints: { '(min-width: 768px)': initialMatches },
    });

    // Detect changes after breakpoint emission
    fixture.detectChanges();

    const router = TestBed.inject(Router);

    return { fixture, component, router };
  }

  it('should toggle sidenavOpened when hamburger button is clicked (Requirement 5.6)', () => {
    const { component } = setup(false); // mobile mode — hamburger visible

    // Initially closed on mobile
    expect(component.sidenavOpened()).toBe(false);

    // Simulate hamburger click
    component.toggleSidenav();
    expect(component.sidenavOpened()).toBe(true);

    // Click again to close
    component.toggleSidenav();
    expect(component.sidenavOpened()).toBe(false);
  });

  it('should call router.navigate(["/support"]) when FAB is clicked (Requirement 8.7)', () => {
    const { component, router } = setup(false);

    const navigateSpy = vi.spyOn(router, 'navigate').mockResolvedValue(true);

    component.navigateToSupport();

    expect(navigateSpy).toHaveBeenCalledWith(['/support']);
  });

  it('should close sidenav when closeSidenavOnMobile() is called in mode="over" (Requirement 6.8)', () => {
    const { component } = setup(false); // mobile mode → mode="over"

    // Open the sidenav manually
    component.sidenavOpened.set(true);
    expect(component.sidenavOpened()).toBe(true);
    expect(component.sidenavMode()).toBe('over');

    // Call closeSidenavOnMobile — should close because we're on mobile
    component.closeSidenavOnMobile();
    expect(component.sidenavOpened()).toBe(false);
  });

  it('should NOT close sidenav when closeSidenavOnMobile() is called in mode="side" (desktop)', () => {
    const { component } = setup(true); // desktop mode → mode="side"

    // Sidenav is open on desktop
    expect(component.sidenavOpened()).toBe(true);
    expect(component.sidenavMode()).toBe('side');

    // Call closeSidenavOnMobile — should NOT close because we're on desktop
    component.closeSidenavOnMobile();
    expect(component.sidenavOpened()).toBe(true);
  });
});


describe('App - Error Handling (Requirement 1.8)', () => {
  let fixture: ComponentFixture<App>;
  let breakpointSubject: Subject<BreakpointState>;

  beforeEach(() => {
    breakpointSubject = new Subject<BreakpointState>();

    const breakpointObserverMock = {
      observe: () => breakpointSubject.asObservable(),
    };

    // Custom loader that simulates an HTTP error (e.g., 404)
    const failingLoader = {
      getTranslation: () => {
        return new Observable((subscriber) => {
          subscriber.error(new Error('Http failure response for ./assets/i18n/el.json: 404 Not Found'));
        });
      },
    };

    TestBed.configureTestingModule({
      imports: [
        App,
        NoopAnimationsModule,
        TranslateModule.forRoot({
          loader: {
            provide: TranslateLoader,
            useValue: failingLoader,
          },
          defaultLanguage: 'el',
        }),
      ],
      providers: [
        provideRouter([]),
        provideHttpClient(),
        { provide: BreakpointObserver, useValue: breakpointObserverMock },
      ],
    });

    fixture = TestBed.createComponent(App);

    // Trigger ngOnInit which calls translate.use('el') → loader returns error
    fixture.detectChanges();

    // Emit mobile breakpoint state
    breakpointSubject.next({
      matches: false,
      breakpoints: { '(min-width: 768px)': false },
    });

    fixture.detectChanges();
  });

  it('should render without throwing when translation file fails to load', () => {
    // The component should have rendered without throwing
    expect(fixture.componentInstance).toBeTruthy();
    expect(() => fixture.detectChanges()).not.toThrow();
  });

  it('should display raw translation key names as fallback when translation file fails to load', () => {
    fixture.detectChanges();

    // The app should display raw key names as fallback text
    const nativeElement = fixture.nativeElement as HTMLElement;
    const textContent = nativeElement.textContent || '';

    // NAV.TITLE is used in the toolbar title span — when translations fail,
    // ngx-translate displays the raw key string as fallback
    expect(textContent).toContain('NAV.TITLE');
  });
});

describe('App - Translation File Structure (Requirements 2.2–2.5, 2.7)', () => {
  let translations: Record<string, unknown>;

  beforeAll(() => {
    const filePath = path.resolve(__dirname, '../assets/i18n/el.json');
    const fileContent = fs.readFileSync(filePath, 'utf-8');
    translations = JSON.parse(fileContent);
  });

  describe('NAV namespace (Requirement 2.2)', () => {
    it('should contain NAV namespace with TITLE, HOME, WIKI, and TOOLS keys', () => {
      expect(translations).toHaveProperty('NAV');
      const nav = translations['NAV'] as Record<string, unknown>;
      expect(nav).toHaveProperty('TITLE');
      expect(nav).toHaveProperty('HOME');
      expect(nav).toHaveProperty('WIKI');
      expect(nav).toHaveProperty('TOOLS');
    });

    it('should have non-empty string values for all NAV keys', () => {
      const nav = translations['NAV'] as Record<string, string>;
      expect(typeof nav['TITLE']).toBe('string');
      expect(nav['TITLE'].length).toBeGreaterThan(0);
      expect(typeof nav['HOME']).toBe('string');
      expect(nav['HOME'].length).toBeGreaterThan(0);
      expect(typeof nav['WIKI']).toBe('string');
      expect(nav['WIKI'].length).toBeGreaterThan(0);
      expect(typeof nav['TOOLS']).toBe('string');
      expect(nav['TOOLS'].length).toBeGreaterThan(0);
    });
  });

  describe('SIDENAV namespace (Requirement 2.3)', () => {
    it('should contain SIDENAV namespace with PLACEHOLDER key', () => {
      expect(translations).toHaveProperty('SIDENAV');
      const sidenav = translations['SIDENAV'] as Record<string, unknown>;
      expect(sidenav).toHaveProperty('PLACEHOLDER');
    });

    it('should have a non-empty string value for SIDENAV.PLACEHOLDER', () => {
      const sidenav = translations['SIDENAV'] as Record<string, string>;
      expect(typeof sidenav['PLACEHOLDER']).toBe('string');
      expect(sidenav['PLACEHOLDER'].length).toBeGreaterThan(0);
    });
  });

  describe('FAB namespace (Requirement 2.4)', () => {
    it('should contain FAB namespace with ARIA_LABEL key', () => {
      expect(translations).toHaveProperty('FAB');
      const fab = translations['FAB'] as Record<string, unknown>;
      expect(fab).toHaveProperty('ARIA_LABEL');
    });

    it('should have a non-empty string value for FAB.ARIA_LABEL', () => {
      const fab = translations['FAB'] as Record<string, string>;
      expect(typeof fab['ARIA_LABEL']).toBe('string');
      expect(fab['ARIA_LABEL'].length).toBeGreaterThan(0);
    });
  });

  describe('GENERAL namespace (Requirement 2.5)', () => {
    it('should contain GENERAL namespace with CLOSE and OPEN_MENU keys', () => {
      expect(translations).toHaveProperty('GENERAL');
      const general = translations['GENERAL'] as Record<string, unknown>;
      expect(general).toHaveProperty('CLOSE');
      expect(general).toHaveProperty('OPEN_MENU');
    });

    it('should have non-empty string values for all GENERAL keys', () => {
      const general = translations['GENERAL'] as Record<string, string>;
      expect(typeof general['CLOSE']).toBe('string');
      expect(general['CLOSE'].length).toBeGreaterThan(0);
      expect(typeof general['OPEN_MENU']).toBe('string');
      expect(general['OPEN_MENU'].length).toBeGreaterThan(0);
    });
  });

  describe('Missing translation key fallback (Requirement 2.7)', () => {
    it('should return the raw key string when requesting a non-existent key', () => {
      TestBed.configureTestingModule({
        imports: [TranslateModule.forRoot()],
      });

      const translateService = TestBed.inject(TranslateService);
      translateService.setDefaultLang('el');
      translateService.use('el');

      const result = translateService.instant('NON_EXISTENT_KEY');
      expect(result).toBe('NON_EXISTENT_KEY');
    });
  });
});
