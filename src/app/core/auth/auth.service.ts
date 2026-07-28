import { Injectable, computed, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, tap } from 'rxjs';
import { APP_CONFIG } from '../config/app-config';
import { TokenStorage } from './token-storage';
import { AuthPayload, User } from '../models/domain.models';

/**
 * Состояние авторизации на signals. Хранит текущего пользователя и токен,
 * выполняет login/logout. REST-транспорт для auth (login/me).
 */
@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly http = inject(HttpClient);
  private readonly config = inject(APP_CONFIG);
  private readonly storage = inject(TokenStorage);

  private readonly _user = signal<User | null>(null);
  readonly user = this._user.asReadonly();
  readonly isAuthenticated = computed(() => this._user() !== null);

  /** Токен для интерсептора. Источник — память + localStorage как бэкап. */
  get token(): string | null {
    return this.storage.get();
  }

  login(email: string, password: string): Observable<AuthPayload> {
    return this.http
      .post<AuthPayload>(`${this.config.restBaseUrl}/auth/login`, { email, password })
      .pipe(
        tap((res) => {
          this.storage.set(res.token);
          this._user.set(res.user);
        }),
      );
  }

  /** Подтягивает пользователя по сохранённому токену (например, после перезагрузки). */
  restoreSession(): Observable<User> {
    return this.http
      .get<User>(`${this.config.restBaseUrl}/auth/me`)
      .pipe(tap((user) => this._user.set(user)));
  }

  logout(): void {
    this.storage.clear();
    this._user.set(null);
  }
}
