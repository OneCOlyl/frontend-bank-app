import { ChangeDetectionStrategy, Component } from '@angular/core';

/** Простой индикатор загрузки. Доступный (role=status). */
@Component({
  selector: 'app-spinner',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `<span class="spinner" role="status" aria-label="Загрузка"></span>`,
  styles: [
    `
      .spinner {
        display: inline-block;
        inline-size: 1.5rem;
        block-size: 1.5rem;
        border: 3px solid color-mix(in srgb, currentColor 25%, transparent);
        border-block-start-color: currentColor;
        border-radius: 50%;
        animation: spin 0.7s linear infinite;
      }
      @keyframes spin {
        to {
          transform: rotate(360deg);
        }
      }
      @media (prefers-reduced-motion: reduce) {
        .spinner {
          animation-duration: 2s;
        }
      }
    `,
  ],
})
export class SpinnerComponent {}
