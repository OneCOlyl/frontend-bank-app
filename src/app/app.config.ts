import {
  ApplicationConfig,
  provideBrowserGlobalErrorListeners,
} from '@angular/core';
import {
  provideRouter,
  withComponentInputBinding,
  withInMemoryScrolling,
} from '@angular/router';
import {
  provideClientHydration,
  withEventReplay,
} from '@angular/platform-browser';
import {
  provideHttpClient,
  withFetch,
  withInterceptors,
} from '@angular/common/http';

import { routes } from './app.routes';
import { authInterceptor } from './core/auth/auth.interceptor';
import { APP_CONFIG, DEFAULT_APP_CONFIG } from './core/config/app-config';
import {
  RATES_GATEWAYS,
  RestRatesGateway,
  GrpcRatesGateway,
} from './core/data/rates.gateway';

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideRouter(
      routes,
      withComponentInputBinding(),
      withInMemoryScrolling({ scrollPositionRestoration: 'enabled' }),
    ),
    // withFetch — обязательно для SSR и для HttpClient transfer cache (нет двойных запросов).
    provideHttpClient(withFetch(), withInterceptors([authInterceptor])),
    provideClientHydration(withEventReplay()),

    { provide: APP_CONFIG, useValue: DEFAULT_APP_CONFIG },
    // Набор реализаций одного домена — страница курсов выбирает транспорт в рантайме.
    {
      provide: RATES_GATEWAYS,
      useFactory: (rest: RestRatesGateway, grpc: GrpcRatesGateway) => [rest, grpc],
      deps: [RestRatesGateway, GrpcRatesGateway],
    },
  ],
};
