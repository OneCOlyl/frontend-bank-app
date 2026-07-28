import { Injectable, PLATFORM_ID, inject } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { EMPTY, Observable, filter, map, retry, share } from 'rxjs';
import { APP_CONFIG } from '../config/app-config';

/** Формат сообщений WebSocket-шлюза бэкенда. */
export interface WsMessage<T = unknown> {
  type: string;
  payload: T;
}

/**
 * WebSocket-клиент поверх шлюза /ws. Один общий сокет на приложение (share),
 * авто-переподключение при обрыве (retry). Browser-only: на сервере WebSocket нет.
 * Демонстрирует двунаправленный real-time рядом с однонаправленным SSE.
 */
@Injectable({ providedIn: 'root' })
export class RealtimeSocketService {
  private readonly config = inject(APP_CONFIG);
  private readonly isBrowser = isPlatformBrowser(inject(PLATFORM_ID));

  /** Общий поток всех сообщений сокета (лениво открывается на первого подписчика). */
  private readonly messages$: Observable<WsMessage> = this.isBrowser
    ? new Observable<WsMessage>((subscriber) => {
        const socket = new WebSocket(this.config.wsUrl);
        socket.onmessage = (event) => {
          try {
            subscriber.next(JSON.parse(event.data));
          } catch {
            /* пропускаем некорректный кадр */
          }
        };
        socket.onerror = () => subscriber.error(new Error('WebSocket error'));
        socket.onclose = () => subscriber.complete();
        return () => socket.close();
      }).pipe(
        // При обрыве переподключаемся через 3с; share — один сокет на всех подписчиков.
        retry({ delay: 3000 }),
        share(),
      )
    : EMPTY;

  /** Сообщения конкретного типа (канала), напр. 'application:new'. */
  on<T>(type: string): Observable<T> {
    return this.messages$.pipe(
      filter((m): m is WsMessage<T> => m.type === type),
      map((m) => m.payload),
    );
  }
}
