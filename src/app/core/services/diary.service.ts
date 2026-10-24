/**
 * DiaryService — сервис домена Diary для страниц: чтение дня, добавление
 * продукта, изменение количества и удаление позиции поверх MockApiClient.
 * Все данные дня считает мок; страница только отображает результат вызова.
 *
 * Контракт addFood: { date, mealType, product: FoodInput, quantity }, где
 * quantity — всегда в граммах, а product — без id (его присваивает мок).
 */
import { Injectable, inject } from '@angular/core';

import { DiaryEntry } from '../../shared/models';
import { DiaryAddFoodParams, FoodInput } from '../../mock/diary/handlers';
import { MockApiClient } from '../../mock/mock-api-client';

/** Типы контракта Diary, потребляемые страницами и модалкой. */
export type { DiaryAddFoodParams, FoodInput };

@Injectable({ providedIn: 'root' })
export class DiaryService {
  private readonly client = inject(MockApiClient);

  /** Дневник за дату 'YYYY-MM-DD'; всегда четыре приёма пищи. */
  getDay(date: string): Promise<DiaryEntry> {
    return this.client.call<DiaryEntry>('diary.getDay', { date });
  }

  /** Добавление продукта в приём пищи; quantity — в граммах. */
  addFood(params: DiaryAddFoodParams): Promise<DiaryEntry> {
    return this.client.call<DiaryEntry>('diary.addFood', params);
  }

  /** Изменение количества позиции; quantity — в граммах. */
  updateQuantity(itemId: string, quantity: number): Promise<DiaryEntry> {
    return this.client.call<DiaryEntry>('diary.updateQuantity', { itemId, quantity });
  }

  /** Удаление позиции по id. */
  removeItem(itemId: string): Promise<DiaryEntry> {
    return this.client.call<DiaryEntry>('diary.removeItem', { itemId });
  }
}
