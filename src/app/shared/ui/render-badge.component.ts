import {
  ChangeDetectionStrategy,
  Component,
  PLATFORM_ID,
  computed,
  inject,
  input,
} from '@angular/core';
import { isPlatformServer } from '@angular/common';

/**
 * Наглядно показывает стратегию рендеринга роута и где выполнился рендер.
 * `mode` — декларированный режим (SSG/SSR/ISR/CSR), а факт server/browser
 * определяется по PLATFORM_ID: на сервере видно SSR-разметку до гидрации.
 */
@Component({
  selector: 'app-render-badge',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <span class="badge" [attr.data-mode]="mode()">
      <b>{{ mode() }}</b>
      <span class="where">рендер: {{ where() }}</span>
    </span>
  `,
  styles: [
    `
      .badge {
        display: inline-flex;
        gap: 0.5rem;
        align-items: center;
        padding: 0.25rem 0.6rem;
        border-radius: 999px;
        font-size: 0.75rem;
        background: color-mix(in srgb, var(--psb-accent) 12%, transparent);
        color: var(--psb-accent);
        border: 1px solid color-mix(in srgb, var(--psb-accent) 30%, transparent);
      }
      .where {
        color: var(--psb-muted);
      }
    `,
  ],
})
export class RenderBadgeComponent {
  /** Декларированный режим рендеринга роута. */
  readonly mode = input.required<'SSG' | 'SSR' | 'ISR' | 'CSR'>();

  private readonly isServer = isPlatformServer(inject(PLATFORM_ID));
  readonly where = computed(() => (this.isServer ? 'сервер' : 'браузер'));
}
