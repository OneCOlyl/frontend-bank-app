import { InjectionToken, Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { APP_CONFIG } from '../config/app-config';
import { CurrencyRate } from '../models/domain.models';

/**
 * Абстракция доступа к курсам валют (Dependency Inversion).
 * UI зависит от интерфейса, а не от конкретного транспорта.
 * Реализации: REST (прямо в backend) и gRPC (через BFF Node-сервера).
 */
export interface RatesGateway {
  readonly transport: 'REST' | 'gRPC';
  list(): Observable<CurrencyRate[]>;
}

/** Токен для набора всех реализаций — страница выбирает транспорт в рантайме. */
export const RATES_GATEWAYS = new InjectionToken<RatesGateway[]>('RATES_GATEWAYS');

@Injectable({ providedIn: 'root' })
export class RestRatesGateway implements RatesGateway {
  private readonly http = inject(HttpClient);
  private readonly config = inject(APP_CONFIG);
  readonly transport = 'REST' as const;

  list(): Observable<CurrencyRate[]> {
    return this.http.get<CurrencyRate[]>(`${this.config.restBaseUrl}/rates`);
  }
}

@Injectable({ providedIn: 'root' })
export class GrpcRatesGateway implements RatesGateway {
  private readonly http = inject(HttpClient);
  private readonly config = inject(APP_CONFIG);
  readonly transport = 'gRPC' as const;

  /** Идёт в BFF, который на Node проксирует вызов в gRPC-бэкенд (:50051). */
  list(): Observable<CurrencyRate[]> {
    return this.http.get<CurrencyRate[]>(`${this.config.bffBaseUrl}/grpc/rates`);
  }
}
