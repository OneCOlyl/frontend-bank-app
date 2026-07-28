import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { DatePipe } from '@angular/common';
import { RouterLink } from '@angular/router';
import { NewsService } from '../../core/data/news.service';
import { toAsyncState } from '../../shared/async-state';
import { SpinnerComponent } from '../../shared/ui/spinner.component';
import { RenderBadgeComponent } from '../../shared/ui/render-badge.component';

/**
 * Лента новостей. Режим SSR: свежий рендер на каждый запрос (no-store) — важно для
 * часто обновляемого контента и SEO.
 */
@Component({
  selector: 'app-news-list',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterLink, DatePipe, SpinnerComponent, RenderBadgeComponent],
  template: `
    <header class="head">
      <app-render-badge mode="SSR" />
      <h1>Новости банка</h1>
    </header>

    @let s = state();
    @if (s.loading) {
      <div class="center"><app-spinner /></div>
    } @else if (s.error) {
      <p class="err">Ошибка загрузки: {{ s.error }}</p>
    } @else {
      <div class="list">
        @for (n of s.data; track n.id) {
          <article class="card">
            <time class="muted">{{ n.publishedAt | date: 'longDate' }}</time>
            <h2><a [routerLink]="['/news', n.slug]">{{ n.title }}</a></h2>
            <p>{{ n.excerpt }}</p>
            <div class="tags">
              @for (t of n.tags; track t) {
                <span class="tag">#{{ t }}</span>
              }
            </div>
          </article>
        } @empty {
          <p class="muted">Новостей пока нет.</p>
        }
      </div>
    }
  `,
  styles: [
    `
      .head h1 {
        margin: 0.5rem 0 1rem;
      }
      .list {
        display: grid;
        gap: 1.25rem;
      }
      .card h2 {
        margin: 0.4rem 0;
      }
      .card h2 a {
        text-decoration: none;
      }
      .card h2 a:hover {
        text-decoration: underline;
      }
      .tags {
        display: flex;
        gap: 0.5rem;
        flex-wrap: wrap;
        margin-block-start: 0.75rem;
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
export class NewsListComponent {
  private readonly news = inject(NewsService);
  readonly state = toAsyncState(this.news.list());
}
