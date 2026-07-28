import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { AuthService } from '../core/auth/auth.service';

/** Шапка с адаптивной навигацией и статусом авторизации. */
@Component({
  selector: 'app-header',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterLink, RouterLinkActive],
  template: `
    <header class="hdr">
      <div class="wrap">
        <a routerLink="/" class="logo" aria-label="ПСБ — на главную">
          <span class="mark">ПСБ</span>
          <span class="sub">Банк</span>
        </a>

        <button
          class="burger"
          type="button"
          [attr.aria-expanded]="menuOpen()"
          aria-label="Меню"
          (click)="menuOpen.set(!menuOpen())"
        >
          <span></span><span></span><span></span>
        </button>

        <nav class="nav" [class.open]="menuOpen()" (click)="menuOpen.set(false)">
          <a routerLink="/products" routerLinkActive="active">Продукты</a>
          <a routerLink="/rates" routerLinkActive="active">Курсы валют</a>
          <a routerLink="/news" routerLinkActive="active">Новости</a>
          <a routerLink="/application" routerLinkActive="active">Заявка</a>

          @if (auth.isAuthenticated()) {
            <span class="user">{{ auth.user()?.name }}</span>
            <button class="link" type="button" (click)="auth.logout()">Выйти</button>
          } @else {
            <a routerLink="/login" routerLinkActive="active" class="cta">Войти</a>
          }
        </nav>
      </div>
    </header>
  `,
  styles: [
    `
      .hdr {
        position: sticky;
        top: 0;
        z-index: 10;
        background: var(--psb-brand);
        color: #fff;
      }
      .wrap {
        max-inline-size: 1160px;
        margin-inline: auto;
        padding: 0.75rem 1rem;
        display: flex;
        align-items: center;
        gap: 1rem;
      }
      .logo {
        display: inline-flex;
        align-items: baseline;
        gap: 0.4rem;
        color: #fff;
        text-decoration: none;
        font-weight: 800;
      }
      .mark {
        font-size: 1.4rem;
        letter-spacing: 0.02em;
      }
      .sub {
        opacity: 0.8;
        font-weight: 500;
      }
      .nav {
        margin-inline-start: auto;
        display: flex;
        align-items: center;
        gap: 1.25rem;
      }
      .nav a,
      .link {
        color: #fff;
        text-decoration: none;
        font: inherit;
        background: none;
        border: 0;
        cursor: pointer;
        opacity: 0.9;
      }
      .nav a:hover,
      .nav a.active {
        opacity: 1;
        text-decoration: underline;
      }
      .cta {
        border: 1px solid rgba(255, 255, 255, 0.6);
        padding: 0.35rem 0.9rem;
        border-radius: 8px;
      }
      .user {
        opacity: 0.85;
      }
      .burger {
        display: none;
        margin-inline-start: auto;
        flex-direction: column;
        gap: 4px;
        background: none;
        border: 0;
        cursor: pointer;
        padding: 0.4rem;
      }
      .burger span {
        inline-size: 22px;
        block-size: 2px;
        background: #fff;
      }

      @media (max-width: 760px) {
        .burger {
          display: flex;
        }
        .nav {
          position: absolute;
          inset-inline: 0;
          top: 100%;
          flex-direction: column;
          align-items: stretch;
          gap: 0;
          background: var(--psb-brand);
          padding: 0.5rem 1rem 1rem;
          display: none;
        }
        .nav.open {
          display: flex;
        }
        .nav a,
        .link {
          padding: 0.75rem 0;
          text-align: start;
          border-block-end: 1px solid rgba(255, 255, 255, 0.15);
        }
        .cta {
          text-align: center;
        }
      }
    `,
  ],
})
export class HeaderComponent {
  readonly auth = inject(AuthService);
  readonly menuOpen = signal(false);
}
