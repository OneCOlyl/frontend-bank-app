import { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { TokenStorage } from './token-storage';
import { APP_CONFIG } from '../config/app-config';

/**
 * Добавляет заголовок Authorization: Bearer <token> к запросам на наш backend/BFF.
 * Функциональный интерсептор (Angular 15+). Не трогает сторонние домены.
 */
export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const token = inject(TokenStorage).get();
  const config = inject(APP_CONFIG);

  const isOurApi =
    req.url.startsWith(config.restBaseUrl) ||
    req.url.startsWith(config.graphqlUrl) ||
    req.url.startsWith(config.bffBaseUrl);

  if (token && isOurApi) {
    return next(
      req.clone({ setHeaders: { Authorization: `Bearer ${token}` } }),
    );
  }
  return next(req);
};
