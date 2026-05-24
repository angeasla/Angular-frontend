import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject } from 'rxjs';

interface WikiArticle {
  title: string;
  path: string;
  tags: string[];
}

export interface WikiCategory {
  category: string;
  categoryTitle: string;
  icon: string;
  articles: WikiArticle[];
}

interface WikiIndex {
  categories: WikiCategory[];
  linkMap: Record<string, string>;
}

@Injectable({ providedIn: 'root' })
export class WikiService {
  private categoriesSubject = new BehaviorSubject<WikiCategory[]>([]);
  categories$ = this.categoriesSubject.asObservable();

  private linkMap: Record<string, string> = {};
  private loaded = false;

  constructor(private http: HttpClient) {
    this.load();
  }

  private load(): void {
    if (this.loaded) return;
    this.loaded = true;

    this.http.get<WikiIndex>('/assets/wiki-index.json').subscribe({
      next: (data) => {
        this.categoriesSubject.next(data.categories);
        this.linkMap = data.linkMap;
      },
      error: () => {
        this.categoriesSubject.next([]);
        this.linkMap = {};
      },
    });
  }

  private normalize(query: string): string {
    if (!query) return '';
    return query.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().trim();
  }

  resolveLink(query: string): string | null {
    if (!this.linkMap) return null;
    const normalized = this.normalize(query);

    // 1. Exact match
    if (this.linkMap[normalized]) {
      return this.linkMap[normalized];
    }

    // 2. Fuzzy match: find any key that contains the normalized query
    for (const [key, path] of Object.entries(this.linkMap)) {
      if (key.includes(normalized)) {
        return path;
      }
    }

    return null;
  }
}
