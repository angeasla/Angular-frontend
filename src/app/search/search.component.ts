import { Component, ElementRef, HostListener, OnDestroy, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormControl } from '@angular/forms';
import { Router } from '@angular/router';
import { Subscription, of } from 'rxjs';
import { debounceTime, distinctUntilChanged, filter, map, switchMap, tap, catchError } from 'rxjs/operators';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { TranslateModule } from '@ngx-translate/core';
import { SearchService, SearchResult } from '../services/search.service';

/** Toolbar search box: debounced hybrid search against /api/search with a results dropdown. */
@Component({
  selector: 'app-search',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatFormFieldModule,
    MatInputModule,
    MatIconModule,
    MatButtonModule,
    MatProgressSpinnerModule,
    TranslateModule,
  ],
  template: `
    <div class="search-wrap">
      <mat-form-field appearance="outline" class="search-field" subscriptSizing="dynamic">
        <mat-icon matPrefix>search</mat-icon>
        <input matInput
               [formControl]="query"
               [placeholder]="'SEARCH.PLACEHOLDER' | translate"
               (focus)="open = true"
               autocomplete="off">
        @if (query.value) {
          <button matSuffix mat-icon-button (click)="clear()" [attr.aria-label]="'GENERAL.CLOSE' | translate">
            <mat-icon>close</mat-icon>
          </button>
        }
      </mat-form-field>

      @if (open && (loading() || results().length || searched())) {
        <div class="search-results">
          @if (loading()) {
            <div class="search-status"><mat-spinner diameter="20"></mat-spinner></div>
          }
          @for (r of results(); track r.url) {
            <a class="search-result" (click)="go(r)">
              <span class="sr-title" [innerHTML]="r.title"></span>
              <span class="sr-cat">{{ r.category }}</span>
              <span class="sr-excerpt" [innerHTML]="r.excerpt"></span>
            </a>
          }
          @if (!loading() && searched() && results().length === 0) {
            <div class="search-status">{{ 'SEARCH.NO_RESULTS' | translate }}</div>
          }
        </div>
      }
    </div>
  `,
  styles: [`
    :host { display: flex; flex: 1 1 auto; min-width: 120px; max-width: 380px; margin: 0 12px; }
    .search-wrap { position: relative; width: 100%; max-width: 360px; }
    .search-field { width: 100%; font-size: 0.9rem; }
    /* keep the toolbar compact */
    .search-field ::ng-deep .mat-mdc-form-field-subscript-wrapper { display: none; }
    /* The toolbar is dark, so make the field light-on-dark and readable. */
    .search-field ::ng-deep .mat-mdc-text-field-wrapper { background: rgba(255,255,255,0.15); border-radius: 8px; }
    .search-field ::ng-deep input.mat-mdc-input-element { color: #fff; caret-color: #fff; }
    .search-field ::ng-deep input.mat-mdc-input-element::placeholder {
      color: rgba(255,255,255,0.7); -webkit-text-fill-color: rgba(255,255,255,0.7);
    }
    .search-field ::ng-deep .mat-mdc-form-field-icon-prefix,
    .search-field ::ng-deep .mat-mdc-form-field-icon-suffix,
    .search-field ::ng-deep mat-icon { color: rgba(255,255,255,0.9); }
    .search-field ::ng-deep .mdc-notched-outline__leading,
    .search-field ::ng-deep .mdc-notched-outline__notch,
    .search-field ::ng-deep .mdc-notched-outline__trailing { border-color: rgba(255,255,255,0.35); }
    .search-results {
      position: absolute; top: calc(100% + 4px); left: 0; right: 0; z-index: 1000;
      background: #fff; color: #1f2937; border-radius: 8px; max-height: 60vh; overflow-y: auto;
      box-shadow: 0 8px 24px rgba(0,0,0,0.2);
    }
    .search-result {
      display: block; padding: 10px 14px; cursor: pointer; border-bottom: 1px solid rgba(0,0,0,0.06);
      text-decoration: none; color: inherit;
    }
    .search-result:hover { background: rgba(220,38,38,0.06); }
    .sr-title { display: block; font-weight: 600; }
    .sr-cat { display: block; font-size: 0.75rem; color: #6b7280; }
    .sr-excerpt { display: block; font-size: 0.8rem; color: #4b5563; margin-top: 2px;
                  overflow: hidden; text-overflow: ellipsis; display: -webkit-box;
                  -webkit-line-clamp: 2; -webkit-box-orient: vertical; }
    .sr-title ::ng-deep mark, .sr-excerpt ::ng-deep mark { background: #fde68a; padding: 0 1px; }
    .search-status { padding: 12px 14px; color: #6b7280; }
  `],
})
export class SearchComponent implements OnInit, OnDestroy {
  query = new FormControl('');
  results = signal<SearchResult[]>([]);
  loading = signal(false);
  searched = signal(false);
  open = false;

  private sub?: Subscription;

  constructor(private search: SearchService, private router: Router, private el: ElementRef) {}

  ngOnInit(): void {
    this.sub = this.query.valueChanges
      .pipe(
        map(v => (v ?? '').trim()),
        debounceTime(300),
        distinctUntilChanged(),
        tap(v => {
          if (v.length < 2) {
            this.results.set([]);
            this.searched.set(false);
          }
        }),
        filter(v => v.length >= 2),
        tap(() => { this.loading.set(true); this.open = true; }),
        switchMap(v => this.search.search(v, 7).pipe(catchError(() => of([] as SearchResult[])))),
      )
      .subscribe(res => {
        this.results.set(res);
        this.loading.set(false);
        this.searched.set(true);
      });
  }

  ngOnDestroy(): void {
    this.sub?.unsubscribe();
  }

  go(r: SearchResult): void {
    const slug = r.url.replace(/^#?\//, '');
    const parts = slug.split('/');
    if (parts.length >= 2) {
      this.router.navigate(['/wiki', parts[0], parts.slice(1).join('/') + '.md']);
    } else {
      this.router.navigate(['/wiki', '.', slug + '.md']);
    }
    this.reset();
  }

  clear(): void {
    this.reset();
  }

  private reset(): void {
    this.query.setValue('');
    this.results.set([]);
    this.searched.set(false);
    this.open = false;
  }

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent): void {
    if (!this.el.nativeElement.contains(event.target)) {
      this.open = false;
    }
  }
}
