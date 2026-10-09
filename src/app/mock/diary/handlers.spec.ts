import { fakeAsync, tick } from '@angular/core/testing';

import { MealType, MEAL_TYPES, STORAGE_KEYS } from '../../shared/models';
import { INVALID_FORM_MESSAGE } from '../../shared/validation/error-texts';
import { MockApiClient } from '../mock-api-client';
import {
  MockDb,
  MockDbData,
  MockDiaryRecord,
  configureMockDbSeed,
  emptyMockDbData,
  resetMockDbSeed,
} from '../mock-db';
import { MOCK_MESSAGES, MockValidationError } from '../mock-error';
import { SessionStore } from '../auth/session-store';
import {
  DiaryAddFoodParams,
  handleDiaryAddFood,
  handleDiaryGetDay,
  handleDiaryRemoveItem,
  handleDiaryUpdateQuantity,
  registerDiaryHandlers,
} from './handlers';

const USER_ID = 'user-0001';
const DATE = '2026-01-01';
const OTHER_DATE = '2026-02-02';
const ITEM_ID = 'item-0001';

const FOOD = { name: 'Яблоко', calories: 52, protein: 0.3, fat: 0.2, carbs: 14 };

function diaryRecord(date: string): MockDiaryRecord {
  return {
    id: `diary-${date}`,
    userId: USER_ID,
    date,
    meals: MEAL_TYPES.map((type) => ({
      id: `meal-${date}-${type}`,
      type,
      items:
        type === 'breakfast'
          ? [{ id: ITEM_ID, product: { id: 'prod-0001', ...FOOD }, quantity: 100 }]
          : [],
    })),
  };
}

function makeSeed(): MockDbData {
  return {
    ...emptyMockDbData(),
    users: [{ id: USER_ID, name: 'Алексей', email: 'alex@example.com', password: 'Demo1234!' }],
    diary: [diaryRecord(DATE)],
  };
}

function setup(): { db: MockDb; session: SessionStore } {
  configureMockDbSeed(() => structuredClone(makeSeed()));
  return { db: new MockDb(), session: new SessionStore() };
}

function catchValidation(fn: () => unknown): MockValidationError {
  try {
    fn();
  } catch (error: unknown) {
    if (error instanceof MockValidationError) {
      return error;
    }
    throw error;
  }
  fail('обработчик не бросил MockValidationError');
  throw new Error('unreachable');
}

function addFoodParams(overrides: Partial<DiaryAddFoodParams> = {}): DiaryAddFoodParams {
  return { date: DATE, mealType: 'breakfast', product: { ...FOOD }, quantity: 100, ...overrides };
}

describe('Обработчики diary — домен Diary', () => {
  beforeEach(() => {
    localStorage.clear();
    resetMockDbSeed();
  });

  afterEach(() => {
    localStorage.clear();
    resetMockDbSeed();
  });

  describe('diary.getDay', () => {
    it('без сессии → 401 «Не авторизован», БД не тронута', () => {
      const { db, session } = setup();
      const error = catchValidation(() => handleDiaryGetDay(db, session, { date: DATE }));
      expect(error.status).toBe(401);
      expect(error.message).toBe(MOCK_MESSAGES.unauthorized);
    });

    it('существующая запись: четыре приёма пищи и позиции, без служебного userId', () => {
      const { db, session } = setup();
      session.setUserId(USER_ID);
      const entry = handleDiaryGetDay(db, session, { date: DATE });

      expect(entry.date).toBe(DATE);
      expect(entry.meals.length).toBe(4);
      expect(entry.meals.map((meal) => meal.type)).toEqual([...MEAL_TYPES]);
      expect(entry.meals[0].items.length).toBe(1);
      expect(entry.meals[0].items[0].product.name).toBe('Яблоко');
      expect(Object.prototype.hasOwnProperty.call(entry, 'userId')).toBeFalse();
    });

    it('неизвестная дата: пустой день из четырёх приёмов, но в БД остаётся одна запись', () => {
      const { db, session } = setup();
      session.setUserId(USER_ID);
      const entry = handleDiaryGetDay(db, session, { date: OTHER_DATE });

      expect(entry.date).toBe(OTHER_DATE);
      expect(entry.meals.length).toBe(4);
      expect(entry.meals.every((meal) => meal.items.length === 0)).toBeTrue();
      expect(db.read().diary.length).toBe(1);
    });
  });

  describe('diary.addFood', () => {
    it('успех: позиция добавлена с присвоенным id продукта', () => {
      const { db, session } = setup();
      session.setUserId(USER_ID);
      const entry = handleDiaryAddFood(db, session, addFoodParams());

      const items = entry.meals.find((meal) => meal.type === 'breakfast')?.items ?? [];
      expect(items.length).toBe(2);
      const added = items[1];
      expect(added.quantity).toBe(100);
      expect(added.product.id).not.toBe('');
      expect(added.product.name).toBe('Яблоко');
      expect(db.read().diary.length).toBe(1);
    });

    it('новая дата: запись дня создаётся лениво', () => {
      const { db, session } = setup();
      session.setUserId(USER_ID);
      const entry = handleDiaryAddFood(db, session, addFoodParams({ date: OTHER_DATE }));

      expect(entry.date).toBe(OTHER_DATE);
      expect(entry.meals.find((meal) => meal.type === 'breakfast')?.items.length).toBe(1);
      expect(db.read().diary.length).toBe(2);
    });

    it('пустое название и нулевое количество → 400 с ошибками полей', () => {
      const { db, session } = setup();
      session.setUserId(USER_ID);
      const error = catchValidation(() =>
        handleDiaryAddFood(db, session, addFoodParams({ product: { ...FOOD, name: '  ' }, quantity: 0 })),
      );
      expect(error.status).toBe(400);
      expect(error.message).toBe(INVALID_FORM_MESSAGE);
      expect(Object.keys(error.errors ?? {}).sort()).toEqual(['name', 'quantity']);
    });

    it('отрицательная пищевая ценность → 400 с ошибкой поля', () => {
      const { db, session } = setup();
      session.setUserId(USER_ID);
      const error = catchValidation(() =>
        handleDiaryAddFood(db, session, addFoodParams({ product: { ...FOOD, calories: -1 } })),
      );
      expect(error.status).toBe(400);
      expect(error.errors?.['calories']).toBeDefined();
    });

    it('неизвестный приём пищи → 400 «Неизвестный приём пищи»', () => {
      const { db, session } = setup();
      session.setUserId(USER_ID);
      const error = catchValidation(() =>
        handleDiaryAddFood(db, session, addFoodParams({ mealType: 'brunch' as unknown as MealType })),
      );
      expect(error.status).toBe(400);
      expect(error.errors?.['mealType']).toEqual(['Неизвестный приём пищи']);
      expect(db.read().diary.length).toBe(1);
    });

    it('без сессии → 401 прежде валидации', () => {
      const { db, session } = setup();
      const error = catchValidation(() => handleDiaryAddFood(db, session, addFoodParams({ quantity: 0 })));
      expect(error.status).toBe(401);
    });
  });

  describe('diary.updateQuantity', () => {
    it('успех: количество позиции изменено', () => {
      const { db, session } = setup();
      session.setUserId(USER_ID);
      const entry = handleDiaryUpdateQuantity(db, session, { itemId: ITEM_ID, quantity: 250 });

      expect(entry.meals[0].items[0].quantity).toBe(250);
      expect(db.read().diary[0].meals[0].items[0].quantity).toBe(250);
    });

    it('нулевое количество → 400 с ошибкой поля quantity', () => {
      const { db, session } = setup();
      session.setUserId(USER_ID);
      const error = catchValidation(() =>
        handleDiaryUpdateQuantity(db, session, { itemId: ITEM_ID, quantity: 0 }),
      );
      expect(error.status).toBe(400);
      expect(error.errors?.['quantity']).toBeDefined();
    });

    it('неизвестная позиция → 404 «Запись не найдена»', () => {
      const { db, session } = setup();
      session.setUserId(USER_ID);
      const error = catchValidation(() =>
        handleDiaryUpdateQuantity(db, session, { itemId: 'ghost', quantity: 100 }),
      );
      expect(error.status).toBe(404);
      expect(error.message).toBe(MOCK_MESSAGES.notFound);
    });

    it('без сессии → 401', () => {
      const { db, session } = setup();
      const error = catchValidation(() =>
        handleDiaryUpdateQuantity(db, session, { itemId: ITEM_ID, quantity: 100 }),
      );
      expect(error.status).toBe(401);
    });
  });

  describe('diary.removeItem', () => {
    it('успех: позиция удалена из дня', () => {
      const { db, session } = setup();
      session.setUserId(USER_ID);
      const entry = handleDiaryRemoveItem(db, session, { itemId: ITEM_ID });

      expect(entry.meals[0].items.length).toBe(0);
      expect(db.read().diary[0].meals[0].items.length).toBe(0);
    });

    it('неизвестная позиция → 404 «Запись не найдена»', () => {
      const { db, session } = setup();
      session.setUserId(USER_ID);
      const error = catchValidation(() => handleDiaryRemoveItem(db, session, { itemId: 'ghost' }));
      expect(error.status).toBe(404);
      expect(error.message).toBe(MOCK_MESSAGES.notFound);
    });
  });

  describe('registerDiaryHandlers — конвейер MockApiClient', () => {
    it('getDay через call: успех и задержка', fakeAsync(() => {
      setup();
      localStorage.setItem(STORAGE_KEYS.session, USER_ID);
      const client = new MockApiClient();
      registerDiaryHandlers(client);

      let entry: { meals: unknown[] } | undefined;
      client.call<{ meals: unknown[] }>('diary.getDay', { date: DATE }).then((value) => (entry = value));
      tick(500);
      expect(entry?.meals.length).toBe(4);
    }));

    it('401 выходит транспортной формой ApiError', fakeAsync(() => {
      setup();
      const client = new MockApiClient();
      registerDiaryHandlers(client);

      let rejection: unknown = null;
      client
        .call('diary.getDay', { date: DATE })
        .catch((error: unknown) => (rejection = error));
      tick(500);
      expect(rejection).toEqual({ status: 401, body: { message: MOCK_MESSAGES.unauthorized } });
    }));
  });
});
