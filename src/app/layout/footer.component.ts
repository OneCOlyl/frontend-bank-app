import { ChangeDetectionStrategy, Component } from '@angular/core';

@Component({
  selector: 'app-footer',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <footer class="ftr">
      <div class="wrap">
        <p>© {{ year }} ПСБ — тестовое фронтенд-приложение.</p>
        <p class="muted">
          Демо: Angular {{ ngVersion }} · REST + GraphQL + gRPC (BFF) · SSR / SSG / ISR / CSR
        </p>
      </div>
    </footer>
  `,
  styles: [
    `
      .ftr {
        margin-block-start: 3rem;
        background: var(--psb-brand-dark);
        color: rgba(255, 255, 255, 0.85);
      }
      .wrap {
        max-inline-size: 1160px;
        margin-inline: auto;
        padding: 1.5rem 1rem;
      }
      .muted {
        opacity: 0.7;
        font-size: 0.85rem;
      }
    `,
  ],
})
export class FooterComponent {
  readonly year = new Date().getFullYear();
  readonly ngVersion = 21;
}
