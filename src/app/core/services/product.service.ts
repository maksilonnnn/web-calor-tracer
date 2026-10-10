/**
 * ProductService — сервис домена Products: постраничное чтение каталога
 * продуктов (общий справочник, не привязан к пользователю). Работает
 * поверх HttpClient; REST — GET /api/v1/products.
 */
import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';

import { PagedResult, Product } from '../../shared/models';

@Injectable({ providedIn: 'root' })
export class ProductService {
  private readonly http = inject(HttpClient);

  /** Страница каталога, отсортированная по названию. */
  getPaged(page?: number, pageSize?: number): Observable<PagedResult<Product>> {
    let params = new HttpParams();
    if (page !== undefined) {
      params = params.set('page', page);
    }
    if (pageSize !== undefined) {
      params = params.set('pageSize', pageSize);
    }
    return this.http.get<PagedResult<Product>>('products', { params });
  }
}
