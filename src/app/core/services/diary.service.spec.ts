import { TestBed } from '@angular/core/testing';

import { DiaryEntry, MealType, MEAL_TYPES } from '../../shared/models';
import { MockApiClient } from '../../mock/mock-api-client';
import { DiaryService } from './diary.service';

function emptyEntry(date: string): DiaryEntry {
  return {
    id: `diary-${date}`,
    date,
    meals: MEAL_TYPES.map((type: MealType) => ({ id: `meal-${type}`, type, items: [] })),
  };
}

describe('DiaryService — сервис домена Diary', () => {
  let service: DiaryService;
  let client: MockApiClient;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    client = TestBed.inject(MockApiClient);
    service = TestBed.inject(DiaryService);
  });

  it('getDay вызывает diary.getDay с датой', async () => {
    const entry = emptyEntry('2026-01-01');
    const spy = spyOn(client, 'call').and.returnValue(Promise.resolve(entry));

    expect(await service.getDay('2026-01-01')).toBe(entry);
    expect(spy).toHaveBeenCalledWith('diary.getDay', { date: '2026-01-01' });
  });

  it('addFood передаёт дату, приём, продукт без id и граммы', async () => {
    const entry = emptyEntry('2026-01-01');
    const spy = spyOn(client, 'call').and.returnValue(Promise.resolve(entry));
    const params = {
      date: '2026-01-01',
      mealType: 'breakfast' as MealType,
      product: { name: 'Яблоко', calories: 52, protein: 0.3, fat: 0.2, carbs: 14, category: 'Фрукты' },
      quantity: 150,
    };

    expect(await service.addFood(params)).toBe(entry);
    expect(spy).toHaveBeenCalledWith('diary.addFood', params);
  });

  it('updateQuantity передаёт id позиции и граммы', async () => {
    const spy = spyOn(client, 'call').and.returnValue(Promise.resolve(emptyEntry('d')));
    await service.updateQuantity('item-1', 200);
    expect(spy).toHaveBeenCalledWith('diary.updateQuantity', { itemId: 'item-1', quantity: 200 });
  });

  it('removeItem передаёт id позиции', async () => {
    const spy = spyOn(client, 'call').and.returnValue(Promise.resolve(emptyEntry('d')));
    await service.removeItem('item-1');
    expect(spy).toHaveBeenCalledWith('diary.removeItem', { itemId: 'item-1' });
  });

  it('отказ мока пробрасывается как ApiError', async () => {
    const apiError = { status: 401, body: { message: 'Не авторизован' } };
    spyOn(client, 'call').and.returnValue(Promise.reject(apiError));
    await expectAsync(service.getDay('2026-01-01')).toBeRejectedWith(apiError);
  });
});
