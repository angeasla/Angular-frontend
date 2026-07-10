import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

export interface SearchResult {
  title: string;
  url: string;       // e.g. "#/misthos/oromisthio"
  category: string;
  excerpt: string;
}

@Injectable({ providedIn: 'root' })
export class SearchService {
  constructor(private http: HttpClient) {}

  search(q: string, limit = 5): Observable<SearchResult[]> {
    const params = new HttpParams().set('q', q).set('limit', limit);
    return this.http.get<SearchResult[]>(`${environment.apiBaseUrl}/api/search`, { params });
  }
}
