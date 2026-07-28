import {
  ChangeDetectionStrategy,
  Component,
  computed,
  effect,
  inject,
  signal,
} from '@angular/core';
import { toObservable, toSignal } from '@angular/core/rxjs-interop';
import { switchMap } from 'rxjs';
import { RATES_GATEWAYS, RatesGateway } from '../../core/data/rates.gateway';
import { RealtimeRatesService } from '../../core/data/realtime-rates.service';
import { toAsyncState } from '../../shared/async-state';
import { SpinnerComponent } from '../../shared/ui/spinner.component';
import { RenderBadgeComponent } from '../../shared/ui/render-badge.component';
import { CurrencyRate } from '../../core/models/domain.models';

type Trend = 'up' | 'down' | '';

/**
 * Курсы валют. Режим ISR: серверный рендер + Cache-Control s-maxage (см. app.routes.server.ts).
 * Real-time: первичные данные приходят через выбранный транспорт (REST/gRPC), а поверх —
 * поток SSE (`rate:update`), который обновляет таблицу каждые несколько секунд и
 * подсвечивает рост/падение. Переключение транспорта демонстрирует Dependency Inversion.
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

    <div class="controls">
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

      @if (isLive()) {
        <span class="live" title="Обновление в реальном времени через SSE">
          <span class="dot"></span> LIVE · SSE
        </span>
      }
    </div>

    @let s = state();
    @if (s.loading && !live()) {
      <div class="center"><app-spinner /></div>
    } @else if (s.error && !live()) {
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
          @for (r of rows(); track r.code) {
            <tr [attr.data-trend]="trends()[r.code]">
              <th scope="row">
                {{ r.code }}
                @if (r.nominal > 1) {
                  <span class="muted">за {{ r.nominal }}</span>
                }
              </th>
              <td>{{ r.buy.toFixed(2) }} ₽</td>
              <td>
                {{ r.sell.toFixed(2) }} ₽
                @if (trends()[r.code] === 'up') {
                  <span class="arrow up" aria-label="рост">▲</span>
                } @else if (trends()[r.code] === 'down') {
                  <span class="arrow down" aria-label="падение">▼</span>
                }
              </td>
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
      .controls {
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 1rem;
        flex-wrap: wrap;
        margin-block-end: 1.25rem;
      }
      .switch {
        display: flex;
        gap: 0.5rem;
        align-items: center;
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
      .live {
        display: inline-flex;
        align-items: center;
        gap: 0.4rem;
        font-size: 0.8rem;
        font-weight: 700;
        color: var(--psb-ok);
      }
      .live .dot {
        inline-size: 8px;
        block-size: 8px;
        border-radius: 50%;
        background: var(--psb-ok);
        animation: pulse 1.4s ease-in-out infinite;
      }
      @keyframes pulse {
        0%,
        100% {
          opacity: 1;
        }
        50% {
          opacity: 0.3;
        }
      }
      @media (prefers-reduced-motion: reduce) {
        .live .dot {
          animation: none;
        }
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
      .rates tbody tr {
        transition: background 0.6s ease;
      }
      .rates tbody tr[data-trend='up'] {
        background: color-mix(in srgb, var(--psb-ok) 10%, transparent);
      }
      .rates tbody tr[data-trend='down'] {
        background: color-mix(in srgb, var(--psb-err) 10%, transparent);
      }
      .arrow {
        margin-inline-start: 0.35rem;
        font-size: 0.75rem;
      }
      .arrow.up {
        color: var(--psb-ok);
      }
      .arrow.down {
        color: var(--psb-err);
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
  private readonly realtime = inject(RealtimeRatesService);
  readonly selected = signal(0);

  current(): RatesGateway {
    return this.gateways[this.selected()];
  }

  /** Первичная загрузка выбранным транспортом (участвует в SSR). */
  readonly state = toAsyncState(
    toObservable(this.selected).pipe(switchMap((i) => this.gateways[i].list())),
  );

  /** Живой поток курсов через SSE (только в браузере). */
  readonly live = toSignal(this.realtime.stream());
  readonly isLive = computed(() => this.live() !== undefined);

  /** Отображаем live-данные, если они пришли, иначе — первичные. */
  readonly rows = computed<CurrencyRate[]>(() => this.live() ?? this.state().data ?? []);

  /** Направление изменения курса продажи по каждой валюте — для подсветки. */
  readonly trends = signal<Record<string, Trend>>({});
  private prevSell: Record<string, number> = {};

  constructor() {
    // Сравниваем новый кадр с предыдущим и вычисляем тренд.
    effect(() => {
      const current = this.rows();
      const next: Record<string, Trend> = {};
      for (const r of current) {
        const prev = this.prevSell[r.code];
        next[r.code] = prev === undefined || prev === r.sell ? '' : r.sell > prev ? 'up' : 'down';
        this.prevSell[r.code] = r.sell;
      }
      this.trends.set(next);
    });
  }
}
