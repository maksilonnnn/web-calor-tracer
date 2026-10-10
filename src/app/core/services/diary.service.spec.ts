import { provideHttpClient, withInterceptors } from '@angular/common/http';
import {
  HttpTestingController,
  provideHttpClientTesting,
} from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';

import { ApiError, DiaryEntry, MealType, MEAL_TYPES } from '../../shared/models';
import { apiErrorInterceptor } from '../http/api-error.interceptor';
import { DiaryAddFoodParams, DiaryService } from './diary.service';

function emptyEntry(date: string): DiaryEntry {
  return {
    id: `diary-${date}`,
    date,
    meals: MEAL_TYPES.map((type: MealType) => ({ id: `meal-${type}`, type, items: [] })),
  };
}

describe('DiaryService — сервис домена Diary (HttpClient)', () => {
  let service: DiaryService;
  let http: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        provideRouter([]),
        provideHttpClient(withInterceptors([apiErrorInterceptor])),
        provideHttpClientTesting(),
      ],
    });
    service = TestBed.inject(DiaryService);
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => http.verify());

  it('getDay: GET diary с датой', () => {
    const entry = emptyEntry('2026-01-01');
    let received: DiaryEntry | undefined;
    service.getDay('2026-01-01').subscribe((value) => (received = value));

    const request = http.expectOne(
      (req) => req.url === 'diary' && req.params.get('date') === '2026-01-01',
    );
    expect(request.request.method).toBe('GET');
    request.flush(entry);

    expect(received).toEqual(entry);
  });

  it('addFood: POST diary/items с продуктом без id и граммами', () => {
    const entry = emptyEntry('2026-01-01');
    const params: DiaryAddFoodParams = {
      date: '2026-01-01',
      mealType: 'breakfast',
      product: { name: 'Яблоко', calories: 52, protein: 0.3, fat: 0.2, carbs: 14, category: 'Фрукты' },
      quantity: 150,
    };
    let received: DiaryEntry | undefined;
    service.addFood(params).subscribe((value) => (received = value));

    const request = http.expectOne('diary/items');
    expect(request.request.method).toBe('POST');
    expect(request.request.body).toEqual(params);
    request.flush(entry);

    expect(received).toEqual(entry);
  });

  it('updateQuantity: PUT diary/items/{id} с граммами', () => {
    let received: DiaryEntry | undefined;
    service.updateQuantity('item-1', 200).subscribe((value) => (received = value));

    const request = http.expectOne('diary/items/item-1');
    expect(request.request.method).toBe('PUT');
    expect(request.request.body).toEqual({ quantity: 200 });
    request.flush(emptyEntry('d'));

    expect(received).toBeDefined();
  });

  it('removeItem: DELETE diary/items/{id}', () => {
    let received: DiaryEntry | undefined;
    service.removeItem('item-1').subscribe((value) => (received = value));

    const request = http.expectOne('diary/items/item-1');
    expect(request.request.method).toBe('DELETE');
    request.flush(emptyEntry('d'));

    expect(received).toBeDefined();
  });

  it('отказ бэкенда пробрасывается как ApiError', () => {
    let error: ApiError | undefined;
    service.getDay('2026-01-01').subscribe({ error: (value: ApiError) => (error = value) });

    http
      .expectOne((req) => req.url === 'diary')
      .flush({ message: 'Не авторизован' }, { status: 401, statusText: 'Unauthorized' });

    expect(error?.status).toBe(401);
    expect(error?.body.message).toBe('Не авторизован');
  });
});
