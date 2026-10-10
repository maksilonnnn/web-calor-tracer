/**
 * DiaryService — сервис домена Diary для страниц: чтение дня, добавление
 * продукта, изменение количества и удаление позиции. Работает поверх
 * HttpClient; REST см. `/api/v1/diary`.
 *
 * Контракт addFood: { date, mealType, product: FoodInput, quantity }, где
 * quantity — всегда в граммах, а product — без id (его присваивает бэкенд).
 */
import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';

import { DiaryAddFoodParams, DiaryEntry, FoodInput } from '../../shared/models';

/** Типы контракта Diary, потребляемые страницами и модалкой. */
export type { DiaryAddFoodParams, FoodInput };

@Injectable({ providedIn: 'root' })
export class DiaryService {
  private readonly http = inject(HttpClient);

  /** Дневник за дату 'YYYY-MM-DD'; всегда четыре приёма пищи. */
  getDay(date: string): Observable<DiaryEntry> {
    const params = new HttpParams().set('date', date);
    return this.http.get<DiaryEntry>('diary', { params });
  }

  /** Добавление продукта в приём пищи; quantity — в граммах. */
  addFood(params: DiaryAddFoodParams): Observable<DiaryEntry> {
    return this.http.post<DiaryEntry>('diary/items', params);
  }

  /** Изменение количества позиции; quantity — в граммах. */
  updateQuantity(itemId: string, quantity: number): Observable<DiaryEntry> {
    return this.http.put<DiaryEntry>(`diary/items/${itemId}`, { quantity });
  }

  /** Удаление позиции по id. */
  removeItem(itemId: string): Observable<DiaryEntry> {
    return this.http.delete<DiaryEntry>(`diary/items/${itemId}`);
  }
}
