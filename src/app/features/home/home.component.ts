import { ChangeDetectionStrategy, Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { SpinnerComponent } from '../../shared/ui/spinner.component';
import { RenderBadgeComponent } from '../../shared/ui/render-badge.component';
import { FeaturedProductsComponent } from './featured-products.component';

/**
 * Главная. Режим SSG (Prerender): маркетинговый контент статичен и собирается на билде.
 * Блок «Выгодные продукты» — в @defer: его компонент грузится и обращается к бэкенду
 * только в браузере, поэтому prerender не зависит от доступности API на сборке.
 */
@Component({
  selector: 'app-home',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterLink, SpinnerComponent, RenderBadgeComponent, FeaturedProductsComponent],
  template: `
    <section class="hero">
      <div class="hero__text">
        <app-render-badge mode="SSG" />
        <h1>Банк, который работает быстрее</h1>
        <p class="lead">
          Модернизируем клиентские интерфейсы после импортозамещения платформы:
          удобнее, быстрее и безопаснее.
        </p>
        <div class="hero__cta">
          <a routerLink="/products" class="btn">Выбрать продукт</a>
          <a routerLink="/rates" class="btn btn--ghost">Курсы валют</a>
        </div>
      </div>
    </section>

    <section class="feat">
      <h2>Выгодные продукты</h2>
      @defer (on viewport) {
        <app-featured-products />
      } @placeholder {
        <div class="center"><app-spinner /></div>
      }
    </section>
  `,
  styles: [
    `
      .hero {
        background: linear-gradient(135deg, var(--psb-brand), #1746d6);
        color: #fff;
        border-radius: 20px;
        padding: clamp(1.5rem, 4vw, 3.5rem);
      }
      .hero__text {
        max-inline-size: 40rem;
        display: flex;
        flex-direction: column;
        gap: 1rem;
        align-items: flex-start;
      }
      h1 {
        font-size: clamp(1.8rem, 4vw, 3rem);
        margin: 0;
      }
      .lead {
        font-size: 1.15rem;
        opacity: 0.92;
      }
      .hero__cta {
        display: flex;
        gap: 0.75rem;
        flex-wrap: wrap;
      }
      .hero .btn--ghost {
        color: #fff;
        border-color: rgba(255, 255, 255, 0.6);
      }
      .feat {
        margin-block-start: 2.5rem;
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
export class HomeComponent {}
