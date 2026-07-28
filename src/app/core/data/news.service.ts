import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { APP_CONFIG } from '../config/app-config';
import { NewsArticle } from '../models/domain.models';

/** Новости через REST. Используются на SSR-страницах (свежий рендер на сервере). */
@Injectable({ providedIn: 'root' })
export class NewsService {
  private readonly http = inject(HttpClient);
  private readonly config = inject(APP_CONFIG);

  list(limit?: number): Observable<NewsArticle[]> {
    const url = `${this.config.restBaseUrl}/news`;
    return this.http.get<NewsArticle[]>(url, {
      params: limit ? { limit } : {},
    });
  }

  bySlug(slug: string): Observable<NewsArticle> {
    return this.http.get<NewsArticle>(`${this.config.restBaseUrl}/news/${slug}`);
  }
}
