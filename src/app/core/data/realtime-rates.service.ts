import { Injectable, PLATFORM_ID, inject } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { EMPTY, Observable } from 'rxjs';
import { APP_CONFIG } from '../config/app-config';
import { CurrencyRate } from '../models/domain.models';

/**
 * Real-time курсы через Server-Sent Events (нативный EventSource, без библиотек).
 * Однонаправленный поток server → client: бэкенд-тикер шлёт событие `rate:update`
 * каждые несколько секунд. На сервере (SSR) EventSource недоступен — поток пустой,
 * страница отрисуется по первоначальным данным, а live подключится после гидрации.
 */
@Injectable({ providedIn: 'root' })
export class RealtimeRatesService {
  private readonly config = inject(APP_CONFIG);
  private readonly isBrowser = isPlatformBrowser(inject(PLATFORM_ID));

  /** Поток свежих массивов курсов. Автоматически переподключается силами браузера. */
  stream(): Observable<CurrencyRate[]> {
    if (!this.isBrowser) return EMPTY;

    return new Observable<CurrencyRate[]>((subscriber) => {
      const source = new EventSource(this.config.sseRatesUrl);

      source.addEventListener('rate:update', (event) => {
        try {
          subscriber.next(JSON.parse((event as MessageEvent).data));
        } catch {
          /* пропускаем некорректный кадр */
        }
      });

      // Ошибку не пробрасываем как error: EventSource сам переподключается,
      // иначе поток бы завершился навсегда.
      return () => source.close();
    });
  }
}
