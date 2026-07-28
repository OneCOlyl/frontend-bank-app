import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { ProductsService } from '../../core/data/products.service';
import { toAsyncState } from '../../shared/async-state';
import { MoneyPipe } from '../../shared/pipes/money.pipe';
import { SpinnerComponent } from '../../shared/ui/spinner.component';
import { PRODUCT_CATEGORY_LABELS } from '../../core/models/domain.models';

/**
 * Блок «Выгодные продукты». Вынесен в отдельный компонент, чтобы жить внутри @defer
 * на главной: инстанцируется (и делает GraphQL-запрос) только в браузере после гидрации,
 * поэтому prerender главной не зависит от доступности бэкенда на билде.
 */
@Component({
  selector: 'app-featured-products',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterLink, MoneyPipe, SpinnerComponent],
  template: `
    @let state = featured();
    @if (state.loading) {
      <div class="center"><app-spinner /></div>
    } @else if (state.error) {
      <p class="muted">Не удалось загрузить продукты: {{ state.error }}</p>
    } @else {
      <div class="grid">
        @for (p of state.data; track p.id) {
          <article class="card product">
            <span class="tag">{{ labels[p.category] }}</span>
            <h3>{{ p.title }}</h3>
            @if (p.rate) {
              <p class="rate">до {{ p.rate }}%</p>
            }
            <p class="muted">
              Сумма от {{ p.minAmount | money }}
              @if (p.termMonths) {
                · срок {{ p.termMonths }} мес.
              }
            </p>
            <a
              routerLink="/application"
              [queryParams]="{ productId: p.id }"
              class="btn btn--ghost"
            >
              Оформить
            </a>
          </article>
        } @empty {
          <p class="muted">Нет предложений.</p>
        }
      </div>
    }
  `,
  styles: [
    `
      .product {
        display: flex;
        flex-direction: column;
        gap: 0.5rem;
        align-items: flex-start;
      }
      .tag {
        font-size: 0.75rem;
        color: var(--psb-accent);
        font-weight: 700;
        text-transform: uppercase;
      }
      .product h3 {
        margin: 0;
      }
      .rate {
        font-size: 1.6rem;
        font-weight: 800;
        color: var(--psb-brand);
        margin: 0;
      }
      .product .btn {
        margin-block-start: auto;
      }
      .center {
        display: flex;
        justify-content: center;
        padding: 2rem;
        color: var(--psb-brand);
      }
    `,
  ],
})
export class FeaturedProductsComponent {
  private readonly products = inject(ProductsService);
  readonly labels = PRODUCT_CATEGORY_LABELS;
  readonly featured = toAsyncState(this.products.featured());
}
