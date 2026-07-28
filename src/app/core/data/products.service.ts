import { Injectable, inject } from '@angular/core';
import { Observable, map } from 'rxjs';
import { GraphqlClient } from './graphql-client';
import { Product, ProductCategory } from '../models/domain.models';

/**
 * Продукты банка через GraphQL — демонстрация третьего транспорта.
 * Запрашиваем ровно нужные поля (преимущество GraphQL над REST).
 */
@Injectable({ providedIn: 'root' })
export class ProductsService {
  private readonly gql = inject(GraphqlClient);

  private static readonly LIST_QUERY = `
    query Products($category: ProductCategory) {
      products(category: $category) {
        id
        category
        title
        rate
        minAmount
        maxAmount
        termMonths
        featured
      }
    }
  `;

  list(category?: ProductCategory): Observable<Product[]> {
    return this.gql
      .query<{ products: Product[] }>(ProductsService.LIST_QUERY, { category })
      .pipe(map((data) => data.products));
  }

  featured(): Observable<Product[]> {
    return this.list().pipe(map((items) => items.filter((p) => p.featured)));
  }
}
