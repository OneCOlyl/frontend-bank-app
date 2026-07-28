import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, map } from 'rxjs';
import { APP_CONFIG } from '../config/app-config';

interface GraphqlResponse<T> {
  data?: T;
  errors?: { message: string }[];
}

/**
 * Минимальный GraphQL-клиент поверх HttpClient (KISS): без тяжёлого Apollo.
 * Для тестового этого достаточно; в проде можно заменить на apollo-angular,
 * не трогая вызывающие сервисы (они зависят только от метода query()).
 */
@Injectable({ providedIn: 'root' })
export class GraphqlClient {
  private readonly http = inject(HttpClient);
  private readonly config = inject(APP_CONFIG);

  query<T>(query: string, variables?: Record<string, unknown>): Observable<T> {
    return this.http
      .post<GraphqlResponse<T>>(this.config.graphqlUrl, { query, variables })
      .pipe(
        map((res) => {
          if (res.errors?.length) {
            throw new Error(res.errors.map((e) => e.message).join('; '));
          }
          return res.data as T;
        }),
      );
  }
}
