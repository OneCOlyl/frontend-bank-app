import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { switchMap } from 'rxjs';
import { ProductsService } from '../../core/data/products.service';
import { toAsyncState } from '../../shared/async-state';
import { MoneyPipe } from '../../shared/pipes/money.pipe';
import { SpinnerComponent } from '../../shared/ui/spinner.component';
import { RenderBadgeComponent } from '../../shared/ui/render-badge.component';
import {
  PRODUCT_CATEGORY_LABELS,
  ProductCategory,
} from '../../core/models/domain.models';

/**
 * Каталог продуктов. Режим SSR: список рендерится на сервере из GraphQL — контент
 * доступен поисковикам и виден до гидрации. Фильтр по категории — через query-параметр
 * (шарится ссылкой, переживает перезагрузку).
 */
@Component({
  selector: 'app-products',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterLink, MoneyPipe, SpinnerComponent, RenderBadgeComponent],
  template: `
    <header class="head">
      <div>
        <app-render-badge mode="SSR" />
        <h1>Продукты и тарифы</h1>
        <p class="muted">Данные получены через GraphQL.</p>
      </div>
    </header>

    <nav class="filters" aria-label="Фильтр по категории">
      <button
        type="button"
        class="chip"
        [class.active]="!active"
        (click)="setCategory(null)"
      >
        Все
      </button>
      @for (c of categories; track c) {
        <button
          type="button"
          class="chip"
          [class.active]="active === c"
          (click)="setCategory(c)"
        >
          {{ labels[c] }}
        </button>
      }
    </nav>

    @let s = state();
    @if (s.loading) {
      <div class="center"><app-spinner /></div>
    } @else if (s.error) {
      <p class="err">Ошибка загрузки: {{ s.error }}</p>
    } @else {
      <div class="grid">
        @for (p of s.data; track p.id) {
          <article class="card product">
            <span class="tag">{{ labels[p.category] }}</span>
            <h3>{{ p.title }}</h3>
            @if (p.rate) {
              <p class="rate">до {{ p.rate }}%</p>
            }
            <dl class="specs">
              <div>
                <dt>Сумма</dt>
                <dd>{{ p.minAmount | money }} – {{ p.maxAmount | money }}</dd>
              </div>
              @if (p.termMonths) {
                <div>
                  <dt>Срок</dt>
                  <dd>до {{ p.termMonths }} мес.</dd>
                </div>
              }
            </dl>
            <a
              routerLink="/application"
              [queryParams]="{ productId: p.id }"
              class="btn"
            >
              Оформить заявку
            </a>
          </article>
        } @empty {
          <p class="muted">В этой категории пока нет продуктов.</p>
        }
      </div>
    }
  `,
  styles: [
    `
      .head h1 {
        margin: 0.5rem 0 0.25rem;
      }
      .filters {
        display: flex;
        gap: 0.5rem;
        flex-wrap: wrap;
        margin: 1.25rem 0;
      }
      .chip {
        border: 1px solid var(--psb-border);
        background: #fff;
        border-radius: 999px;
        padding: 0.45rem 1rem;
        cursor: pointer;
        font: inherit;
      }
      .chip.active {
        background: var(--psb-brand);
        color: #fff;
        border-color: var(--psb-brand);
      }
      .product {
        display: flex;
        flex-direction: column;
        gap: 0.6rem;
        align-items: flex-start;
      }
      .tag {
        font-size: 0.72rem;
        color: var(--psb-accent);
        font-weight: 700;
        text-transform: uppercase;
      }
      .product h3 {
        margin: 0;
      }
      .rate {
        font-size: 1.5rem;
        font-weight: 800;
        color: var(--psb-brand);
        margin: 0;
      }
      .specs {
        margin: 0;
        display: grid;
        gap: 0.35rem;
        width: 100%;
      }
      .specs div {
        display: flex;
        justify-content: space-between;
        gap: 1rem;
      }
      .specs dt {
        color: var(--psb-muted);
      }
      .specs dd {
        margin: 0;
        font-weight: 600;
        text-align: end;
      }
      .product .btn {
        margin-block-start: auto;
        align-self: stretch;
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
export class ProductsComponent {
  private readonly service = inject(ProductsService);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);

  readonly categories = Object.keys(PRODUCT_CATEGORY_LABELS) as ProductCategory[];
  readonly labels = PRODUCT_CATEGORY_LABELS;

  /** Текущая категория из URL — для подсветки активного чипа. */
  get active(): ProductCategory | null {
    return (this.route.snapshot.queryParamMap.get('category') as ProductCategory) ?? null;
  }

  /** Перезагружает список при смене query-параметра category. */
  readonly state = toAsyncState(
    this.route.queryParamMap.pipe(
      switchMap((params) =>
        this.service.list((params.get('category') as ProductCategory) ?? undefined),
      ),
    ),
  );

  setCategory(category: ProductCategory | null): void {
    this.router.navigate([], {
      queryParams: { category },
      queryParamsHandling: 'merge',
    });
  }
}
