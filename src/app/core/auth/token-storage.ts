import { Injectable, inject, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';

/**
 * Хранилище JWT. Изолирует доступ к localStorage, чтобы код не падал при SSR
 * (на сервере window/localStorage нет). Single Responsibility — только хранение токена.
 */
@Injectable({ providedIn: 'root' })
export class TokenStorage {
  private static readonly KEY = 'psb.token';
  private readonly isBrowser = isPlatformBrowser(inject(PLATFORM_ID));

  get(): string | null {
    if (!this.isBrowser) return null;
    return localStorage.getItem(TokenStorage.KEY);
  }

  set(token: string): void {
    if (!this.isBrowser) return;
    localStorage.setItem(TokenStorage.KEY, token);
  }

  clear(): void {
    if (!this.isBrowser) return;
    localStorage.removeItem(TokenStorage.KEY);
  }
}
