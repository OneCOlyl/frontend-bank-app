import { Signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { HttpErrorResponse } from '@angular/common/http';
import { Observable, catchError, map, of, startWith } from 'rxjs';

/** Унифицированное состояние асинхронной загрузки. */
export interface AsyncState<T> {
  loading: boolean;
  data: T | null;
  error: string | null;
}

/** Человекочитаемое сообщение об ошибке HTTP. */
export function humanizeError(err: unknown): string {
  if (err instanceof HttpErrorResponse) {
    return err.error?.error ?? err.message ?? 'Ошибка запроса';
  }
  if (err instanceof Error) return err.message;
  return 'Неизвестная ошибка';
}

/**
 * Превращает поток данных в реактивное состояние {loading,data,error} (DRY).
 * Подписка происходит в контексте инъекции — работает и на сервере (SSR ждёт ответа),
 * и в браузере. Ошибки не роняют приложение, а отображаются в UI.
 */
export function toAsyncState<T>(source$: Observable<T>): Signal<AsyncState<T>> {
  return toSignal(
    source$.pipe(
      map((data): AsyncState<T> => ({ loading: false, data, error: null })),
      startWith<AsyncState<T>>({ loading: true, data: null, error: null }),
      catchError((err) =>
        of<AsyncState<T>>({ loading: false, data: null, error: humanizeError(err) }),
      ),
    ),
    { initialValue: { loading: true, data: null, error: null } },
  );
}
