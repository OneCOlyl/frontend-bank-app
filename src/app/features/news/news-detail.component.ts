import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { DatePipe } from '@angular/common';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { switchMap } from 'rxjs';
import { NewsService } from '../../core/data/news.service';
import { toAsyncState } from '../../shared/async-state';
import { SpinnerComponent } from '../../shared/ui/spinner.component';
import { RenderBadgeComponent } from '../../shared/ui/render-badge.component';

/**
 * Страница новости. Режим SSR — статья рендерится на сервере по slug.
 * slug читается реактивно из ActivatedRoute — рендер обновится при смене адреса.
 */
@Component({
  selector: 'app-news-detail',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterLink, DatePipe, SpinnerComponent, RenderBadgeComponent],
  template: `
    <a routerLink="/news" class="back">← Все новости</a>

    @let s = state();
    @if (s.loading) {
      <div class="center"><app-spinner /></div>
    } @else if (s.error) {
      <p class="err">Новость не найдена: {{ s.error }}</p>
    } @else if (s.data; as n) {
      <article class="card article">
        <app-render-badge mode="SSR" />
        <time class="muted">{{ n.publishedAt | date: 'longDate' }}</time>
        <h1>{{ n.title }}</h1>
        <p class="lead">{{ n.excerpt }}</p>
        <p>{{ n.body }}</p>
        <div class="tags">
          @for (t of n.tags; track t) {
            <span class="tag">#{{ t }}</span>
          }
        </div>
      </article>
    }
  `,
  styles: [
    `
      .back {
        display: inline-block;
        margin-block-end: 1rem;
        text-decoration: none;
      }
      .article {
        display: flex;
        flex-direction: column;
        gap: 0.75rem;
        align-items: flex-start;
      }
      .article h1 {
        margin: 0.25rem 0;
      }
      .lead {
        font-size: 1.15rem;
        color: var(--psb-muted);
      }
      .tags {
        display: flex;
        gap: 0.5rem;
        flex-wrap: wrap;
      }
      .tag {
        font-size: 0.8rem;
        color: var(--psb-accent);
      }
      .center {
        display: flex;
        justify-content: center;
        padding: 2rem;
        color: var(--psb-brand);
      }
      .err {
        color: var(--psb-err);
      }
    `,
  ],
})
export class NewsDetailComponent {
  private readonly news = inject(NewsService);
  private readonly route = inject(ActivatedRoute);

  readonly state = toAsyncState(
    this.route.paramMap.pipe(
      switchMap((params) => this.news.bySlug(params.get('slug') ?? '')),
    ),
  );
}
