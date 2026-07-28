import { InjectionToken } from '@angular/core';

/**
 * Конфигурация внешних адресов. Вынесена в InjectionToken, чтобы слои-сервисы
 * не знали про конкретные URL (Dependency Inversion из SOLID) и легко мокались в тестах.
 */
export interface AppConfig {
  /** Базовый REST-эндпоинт бэкенда, напр. http://localhost:3000/api/v1 */
  restBaseUrl: string;
  /** GraphQL-эндпоинт бэкенда, напр. http://localhost:3000/graphql */
  graphqlUrl: string;
  /** Префикс BFF-прокси для gRPC (обслуживается Node-сервером Angular). */
  bffBaseUrl: string;
}

export const APP_CONFIG = new InjectionToken<AppConfig>('APP_CONFIG');

/** Значения по умолчанию для локальной разработки (KISS — без сборки environments). */
export const DEFAULT_APP_CONFIG: AppConfig = {
  restBaseUrl: 'http://localhost:3000/api/v1',
  graphqlUrl: 'http://localhost:3000/graphql',
  bffBaseUrl: '/bff',
};
