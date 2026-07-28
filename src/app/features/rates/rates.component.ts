import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { toObservable } from '@angular/core/rxjs-interop';
import { switchMap } from 'rxjs';
import { RATES_GATEWAYS, RatesGateway } from '../../core/data/rates.gateway';
import { toAsyncState } from '../../shared/async-state';
import { SpinnerComponent } from '../../shared/ui/spinner.component';
import { RenderBadgeComponent } from '../../shared/ui/render-badge.component';

/**
 * Курсы валют. Режим ISR: страница рендерится на сервере и кешируется на 60 сек
 * (Cache-Control задаётся в app.routes.server.ts) — быстрый ответ + периодическая
 * регенерация. Демонстрирует переключение транспорта: один и тот же домен через
 * REST и через gRPC (BFF), выбор реализации в рантайме (Dependency Inversion).
 */
@Component({
  selector: 'app-rates',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [SpinnerComponent, RenderBadgeComponent],
  template: `
    <header class="head">
      <app-render-badge mode="ISR" />
      <h1>Курсы валют</h1>
    </header>

    <div class="switch" role="group" aria-label="Транспорт данных">
      <span class="muted">Транспорт:</span>
      @for (g of gateways; track g.transport; let i = $index) {
        <button
          type="button"
          class="chip"
          [class.active]="selected() === i"
          (click)="selected.set(i)"
        >
          {{ g.transport }}
        </button>
      }
    </div>

    @let s = state();
    @if (s.loading) {
      <div class="center"><app-spinner /></div>
    } @else if (s.error) {
      <p class="err">Ошибка загрузки ({{ current().transport }}): {{ s.error }}</p>
    } @else {
      <table class="rates">
        <thead>
          <tr>
            <th scope="col">Валюта</th>
            <th scope="col">Покупка</th>
            <th scope="col">Продажа</th>
          </tr>
        </thead>
        <tbody>
          @for (r of s.data; track r.code) {
            <tr>
              <th scope="row">
                {{ r.code }}
                @if (r.nominal > 1) {
                  <span class="muted">за {{ r.nominal }}</span>
                }
              </th>
              <td>{{ r.buy.toFixed(2) }} ₽</td>
              <td>{{ r.sell.toFixed(2) }} ₽</td>
            </tr>
          }
        </tbody>
      </table>
    }
  `,
  styles: [
    `
      .head h1 {
        margin: 0.5rem 0 1rem;
      }
      .switch {
        display: flex;
        gap: 0.5rem;
        align-items: center;
        margin-block-end: 1.25rem;
        flex-wrap: wrap;
      }
      .chip {
        border: 1px solid var(--psb-border);
        background: #fff;
        border-radius: 999px;
        padding: 0.4rem 0.9rem;
        cursor: pointer;
        font: inherit;
      }
      .chip.active {
        background: var(--psb-brand);
        color: #fff;
        border-color: var(--psb-brand);
      }
      .rates {
        inline-size: 100%;
        border-collapse: collapse;
        background: #fff;
        border-radius: var(--psb-radius);
        overflow: hidden;
        box-shadow: var(--psb-shadow);
      }
      .rates th,
      .rates td {
        padding: 0.85rem 1rem;
        text-align: start;
        border-block-end: 1px solid var(--psb-border);
      }
      .rates thead th {
        background: var(--psb-bg);
        font-size: 0.85rem;
        color: var(--psb-muted);
      }
      .rates td {
        font-variant-numeric: tabular-nums;
      }
      .rates th .muted {
        margin-inline-start: 0.35rem;
        font-weight: 400;
        font-size: 0.8rem;
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
export class RatesComponent {
  readonly gateways = inject(RATES_GATEWAYS);
  readonly selected = signal(0);

  current(): RatesGateway {
    return this.gateways[this.selected()];
  }

  readonly state = toAsyncState(
    toObservable(this.selected).pipe(switchMap((i) => this.gateways[i].list())),
  );
}
