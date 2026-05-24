import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { MarkdownModule } from 'ngx-markdown';
import { switchMap, catchError } from 'rxjs/operators';
import { of } from 'rxjs';
import { LayoutService } from '../../services/layout.service';
import { WikiService } from '../../services/wiki.service';

@Component({
  selector: 'app-wiki-article',
  standalone: true,
  imports: [MarkdownModule],
  templateUrl: './wiki-article.component.html',
  styleUrls: ['./wiki-article.component.scss'],
})
export class WikiArticleComponent implements OnInit {
  markdownData: string = '';

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private http: HttpClient,
    private layoutService: LayoutService,
    private wikiService: WikiService,
    private cdr: ChangeDetectorRef,
  ) {}

  ngOnInit(): void {
    this.layoutService.showSidenav();

    this.route.paramMap
      .pipe(
        switchMap(params => {
          const folder = params.get('folder');
          const file = params.get('file');
          const path = `/assets/wiki/${folder}/${file}`;

          return this.http.get(path, { responseType: 'text' }).pipe(
            catchError(() => of('# Σφάλμα\nΔεν ήταν δυνατή η φόρτωση του άρθρου.'))
          );
        })
      )
      .subscribe(text => {
        // Strip YAML frontmatter
        let parsedText = text.replace(/^---[\s\S]*?---[\r\n]*/, '');

        // Parse [[Wiki Links]] and [[Title|Display Text]]
        parsedText = parsedText.replace(/\[\[(.*?)\]\]/g, (_match, inner) => {
          let title = inner;
          let display = inner;
          if (inner.includes('|')) {
            [title, display] = inner.split('|');
          }
          const resolvedPath = this.wikiService.resolveLink(title.trim());
          if (resolvedPath) {
            return `[${display.trim()}](/wiki/${resolvedPath})`;
          }
          return `**${display.trim()}**`; // Dead link fallback
        });

        this.markdownData = parsedText;
        this.cdr.detectChanges();
      });
  }

  onDocumentClick(event: Event): void {
    const target = event.target as HTMLElement;
    if (target.tagName === 'A') {
      const href = target.getAttribute('href');
      if (href && href.startsWith('/wiki/')) {
        event.preventDefault();
        this.router.navigateByUrl(href);
      }
    }
  }
}
