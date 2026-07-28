import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { RealtimeSocketService } from '../core/data/realtime-socket.service';
import { MoneyPipe } from '../shared/pipes/money.pipe';
import { LoanApplication } from '../core/models/domain.models';

interface Toast {
  id: number;
  application: LoanApplication;
}

/**
 * Real-time уведомления через WebSocket. Слушает канал `application:new`: когда
 * кто-либо (в любой вкладке/сессии) создаёт заявку, показывает тост. Демонстрирует
 * двунаправленный транспорт и глобальный live-эффект поверх всего приложения.
 */
@Component({
  selector: 'app-notifications',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [MoneyPipe],
  template: `
    <div class="stack" aria-live="polite">
      @for (t of toasts(); track t.id) {
        <div class="toast" role="status">
          <span class="icon">🔔</span>
          <div>
            <strong>Новая заявка</strong>
            <p>
              {{ t.application.fullName }} · {{ t.application.amount | money }} ·
              {{ t.application.termMonths }} мес.
            </p>
          </div>
          <button type="button" class="close" aria-label="Закрыть" (click)="dismiss(t.id)">
            ×
          </button>
        </div>
      }
    </div>
  `,
  styles: [
    `
      .stack {
        position: fixed;
        inset-block-end: 1rem;
        inset-inline-end: 1rem;
        z-index: 50;
        display: flex;
        flex-direction: column;
        gap: 0.6rem;
        max-inline-size: min(92vw, 22rem);
      }
      .toast {
        display: flex;
        gap: 0.6rem;
        align-items: flex-start;
        background: var(--psb-surface);
        border: 1px solid var(--psb-border);
        border-inline-start: 4px solid var(--psb-accent);
        border-radius: 12px;
        box-shadow: var(--psb-shadow);
        padding: 0.75rem 0.9rem;
        animation: slide-in 0.25s ease;
      }
      @keyframes slide-in {
        from {
          transform: translateY(0.5rem);
          opacity: 0;
        }
      }
      @media (prefers-reduced-motion: reduce) {
        .toast {
          animation: none;
        }
      }
      .toast p {
        margin: 0.15rem 0 0;
        font-size: 0.85rem;
        color: var(--psb-muted);
      }
      .icon {
        font-size: 1.1rem;
      }
      .close {
        margin-inline-start: auto;
        background: none;
        border: 0;
        font-size: 1.25rem;
        line-height: 1;
        cursor: pointer;
        color: var(--psb-muted);
      }
    `,
  ],
})
export class NotificationsComponent {
  private readonly socket = inject(RealtimeSocketService);
  readonly toasts = signal<Toast[]>([]);
  private nextId = 0;

  constructor() {
    this.socket
      .on<LoanApplication>('application:new')
      .pipe(takeUntilDestroyed())
      .subscribe((application) => this.push(application));
  }

  private push(application: LoanApplication): void {
    const id = this.nextId++;
    this.toasts.update((list) => [...list, { id, application }]);
    // Авто-скрытие через 6 секунд.
    setTimeout(() => this.dismiss(id), 6000);
  }

  dismiss(id: number): void {
    this.toasts.update((list) => list.filter((t) => t.id !== id));
  }
}
