import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { AuthService } from '../../core/auth/auth.service';
import { humanizeError } from '../../shared/async-state';
import { SpinnerComponent } from '../../shared/ui/spinner.component';
import { RenderBadgeComponent } from '../../shared/ui/render-badge.component';

/**
 * Вход. Режим CSR: интерактивная форма, серверный рендер не нужен (страница за логином).
 * Реактивная форма с валидацией. Демо-доступ: demo@psbank.ru / demo1234.
 */
@Component({
  selector: 'app-login',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [ReactiveFormsModule, SpinnerComponent, RenderBadgeComponent],
  template: `
    <div class="wrap">
      <div class="card">
        <app-render-badge mode="CSR" />
        <h1>Вход в личный кабинет</h1>
        <p class="muted">Демо-доступ: <code>demo&#64;psbank.ru</code> / <code>demo1234</code></p>

        <form [formGroup]="form" (ngSubmit)="submit()" novalidate>
          <div class="field">
            <label for="email">Email</label>
            <input id="email" type="email" formControlName="email" autocomplete="username" />
            @if (invalid('email')) {
              <span class="error">Укажите корректный email</span>
            }
          </div>

          <div class="field">
            <label for="password">Пароль</label>
            <input
              id="password"
              type="password"
              formControlName="password"
              autocomplete="current-password"
            />
            @if (invalid('password')) {
              <span class="error">Введите пароль</span>
            }
          </div>

          @if (error()) {
            <p class="error" role="alert">{{ error() }}</p>
          }

          <button class="btn" type="submit" [disabled]="loading()">
            @if (loading()) {
              <app-spinner /> Входим…
            } @else {
              Войти
            }
          </button>
        </form>
      </div>
    </div>
  `,
  styles: [
    `
      .wrap {
        display: flex;
        justify-content: center;
      }
      .card {
        inline-size: min(100%, 26rem);
      }
      h1 {
        margin: 0.5rem 0;
        font-size: 1.5rem;
      }
      code {
        background: var(--psb-bg);
        padding: 0.1rem 0.3rem;
        border-radius: 4px;
      }
      form {
        margin-block-start: 1.25rem;
      }
      .btn {
        inline-size: 100%;
      }
    `,
  ],
})
export class LoginComponent {
  private readonly fb = inject(FormBuilder);
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);

  readonly loading = signal(false);
  readonly error = signal<string | null>(null);

  readonly form = this.fb.nonNullable.group({
    email: ['demo@psbank.ru', [Validators.required, Validators.email]],
    password: ['demo1234', [Validators.required]],
  });

  invalid(name: 'email' | 'password'): boolean {
    const c = this.form.controls[name];
    return c.invalid && (c.dirty || c.touched);
  }

  submit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    this.loading.set(true);
    this.error.set(null);

    const { email, password } = this.form.getRawValue();
    this.auth.login(email, password).subscribe({
      next: () => {
        const returnUrl = this.route.snapshot.queryParamMap.get('returnUrl') ?? '/application';
        this.router.navigateByUrl(returnUrl);
      },
      error: (err) => {
        this.error.set(humanizeError(err));
        this.loading.set(false);
      },
    });
  }
}
