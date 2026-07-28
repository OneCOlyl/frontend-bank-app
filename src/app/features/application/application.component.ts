import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { DatePipe } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { ProductsService } from '../../core/data/products.service';
import { ApplicationsService } from '../../core/data/applications.service';
import { AuthService } from '../../core/auth/auth.service';
import { toAsyncState, humanizeError } from '../../shared/async-state';
import { MoneyPipe } from '../../shared/pipes/money.pipe';
import { SpinnerComponent } from '../../shared/ui/spinner.component';
import { RenderBadgeComponent } from '../../shared/ui/render-badge.component';
import {
  APPLICATION_STATUS_LABELS,
  LoanApplication,
} from '../../core/models/domain.models';

/**
 * Заявка на продукт. Режим CSR + защита authGuard: только для авторизованных.
 * Реактивная форма (валидация), продукты для выбора — через GraphQL, отправка и
 * список заявок — через REST с JWT (добавляет authInterceptor).
 */
@Component({
  selector: 'app-application',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    ReactiveFormsModule,
    DatePipe,
    MoneyPipe,
    SpinnerComponent,
    RenderBadgeComponent,
  ],
  template: `
    <header class="head">
      <app-render-badge mode="CSR" />
      <h1>Заявка на продукт</h1>
      <p class="muted">Вы вошли как {{ auth.user()?.name }}.</p>
    </header>

    <div class="cols">
      <form class="card" [formGroup]="form" (ngSubmit)="submit()" novalidate>
        <div class="field">
          <label for="productId">Продукт</label>
          <select id="productId" formControlName="productId">
            <option value="" disabled>Выберите продукт</option>
            @for (p of products().data ?? []; track p.id) {
              <option [value]="p.id">{{ p.title }}</option>
            }
          </select>
          @if (invalid('productId')) {
            <span class="error">Выберите продукт</span>
          }
        </div>

        <div class="field">
          <label for="fullName">ФИО</label>
          <input id="fullName" formControlName="fullName" autocomplete="name" />
          @if (invalid('fullName')) {
            <span class="error">Минимум 2 символа</span>
          }
        </div>

        <div class="field">
          <label for="phone">Телефон</label>
          <input id="phone" formControlName="phone" inputmode="tel" placeholder="+7 900 000-00-00" />
          @if (invalid('phone')) {
            <span class="error">Укажите телефон</span>
          }
        </div>

        <div class="row">
          <div class="field">
            <label for="amount">Сумма, ₽</label>
            <input id="amount" type="number" formControlName="amount" min="1" />
            @if (invalid('amount')) {
              <span class="error">Сумма больше 0</span>
            }
          </div>
          <div class="field">
            <label for="termMonths">Срок, мес.</label>
            <input id="termMonths" type="number" formControlName="termMonths" min="1" />
            @if (invalid('termMonths')) {
              <span class="error">Срок больше 0</span>
            }
          </div>
        </div>

        @if (formError()) {
          <p class="error" role="alert">{{ formError() }}</p>
        }
        @if (success()) {
          <p class="ok" role="status">Заявка отправлена!</p>
        }

        <button class="btn" type="submit" [disabled]="submitting()">
          @if (submitting()) {
            <app-spinner /> Отправка…
          } @else {
            Отправить заявку
          }
        </button>
      </form>

      <section class="card">
        <h2>Мои заявки</h2>
        @if (loadingList()) {
          <div class="center"><app-spinner /></div>
        } @else if (applications().length === 0) {
          <p class="muted">Заявок пока нет.</p>
        } @else {
          <ul class="apps">
            @for (a of applications(); track a.id) {
              <li>
                <div>
                  <strong>{{ a.amount | money }}</strong>
                  <span class="muted">· {{ a.termMonths }} мес.</span>
                </div>
                <div class="meta">
                  <span class="status" [attr.data-s]="a.status">{{ statusLabel(a.status) }}</span>
                  <time class="muted">{{ a.createdAt | date: 'short' }}</time>
                </div>
              </li>
            }
          </ul>
        }
      </section>
    </div>
  `,
  styles: [
    `
      .head h1 {
        margin: 0.5rem 0 0.25rem;
      }
      .cols {
        display: grid;
        gap: 1.5rem;
        grid-template-columns: 1fr;
      }
      @media (min-width: 820px) {
        .cols {
          grid-template-columns: 1.2fr 1fr;
          align-items: start;
        }
      }
      .row {
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: 1rem;
      }
      .btn {
        inline-size: 100%;
      }
      .ok {
        color: var(--psb-ok);
      }
      h2 {
        margin-block-start: 0;
      }
      .apps {
        list-style: none;
        margin: 0;
        padding: 0;
        display: grid;
        gap: 0.75rem;
      }
      .apps li {
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding: 0.75rem;
        border: 1px solid var(--psb-border);
        border-radius: 10px;
      }
      .meta {
        display: flex;
        flex-direction: column;
        align-items: flex-end;
        gap: 0.2rem;
      }
      .status {
        font-size: 0.8rem;
        font-weight: 700;
        padding: 0.1rem 0.5rem;
        border-radius: 999px;
        background: color-mix(in srgb, var(--psb-brand) 12%, transparent);
        color: var(--psb-brand);
      }
      .status[data-s='approved'] {
        background: color-mix(in srgb, var(--psb-ok) 15%, transparent);
        color: var(--psb-ok);
      }
      .status[data-s='rejected'] {
        background: color-mix(in srgb, var(--psb-err) 15%, transparent);
        color: var(--psb-err);
      }
      .center {
        display: flex;
        justify-content: center;
        padding: 1.5rem;
        color: var(--psb-brand);
      }
    `,
  ],
})
export class ApplicationComponent {
  private readonly fb = inject(FormBuilder);
  private readonly productsService = inject(ProductsService);
  private readonly applicationsService = inject(ApplicationsService);
  private readonly route = inject(ActivatedRoute);
  readonly auth = inject(AuthService);

  readonly products = toAsyncState(this.productsService.list());
  readonly applications = signal<LoanApplication[]>([]);
  readonly loadingList = signal(true);

  readonly submitting = signal(false);
  readonly formError = signal<string | null>(null);
  readonly success = signal(false);

  readonly form = this.fb.nonNullable.group({
    productId: [this.route.snapshot.queryParamMap.get('productId') ?? '', Validators.required],
    fullName: ['', [Validators.required, Validators.minLength(2)]],
    phone: ['', [Validators.required, Validators.minLength(5)]],
    amount: [100000, [Validators.required, Validators.min(1)]],
    termMonths: [12, [Validators.required, Validators.min(1)]],
  });

  constructor() {
    this.reloadList();
  }

  invalid(name: keyof typeof this.form.controls): boolean {
    const c = this.form.controls[name];
    return c.invalid && (c.dirty || c.touched);
  }

  statusLabel(s: LoanApplication['status']): string {
    return APPLICATION_STATUS_LABELS[s];
  }

  submit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    this.submitting.set(true);
    this.formError.set(null);
    this.success.set(false);

    this.applicationsService.create(this.form.getRawValue()).subscribe({
      next: () => {
        this.success.set(true);
        this.submitting.set(false);
        this.reloadList();
      },
      error: (err) => {
        this.formError.set(humanizeError(err));
        this.submitting.set(false);
      },
    });
  }

  private reloadList(): void {
    this.loadingList.set(true);
    this.applicationsService.list().subscribe({
      next: (items) => {
        this.applications.set(items);
        this.loadingList.set(false);
      },
      error: () => this.loadingList.set(false),
    });
  }
}
