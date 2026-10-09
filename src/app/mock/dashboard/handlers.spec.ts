import { fakeAsync, tick } from '@angular/core/testing';

import {
  DashboardData,
  DEFAULT_SETTINGS,
  Meal,
  MealItem,
  MealType,
  MEAL_TYPES,
  Product,
  Settings,
  STORAGE_KEYS,
} from '../../shared/models';
import { MockApiClient } from '../mock-api-client';
import {
  MockDb,
  MockDbData,
  MockDiaryRecord,
  MockSettingsRecord,
  configureMockDbSeed,
  emptyMockDbData,
  resetMockDbSeed,
} from '../mock-db';
import { MOCK_MESSAGES, MockValidationError } from '../mock-error';
import { SessionStore } from '../auth/session-store';
import { handleDashboardGetDay, registerDashboardHandlers } from './handlers';

const USER_ID = 'user-0001';
const DATE = '2026-01-03';
const PREV_DATE = '2026-01-02';

function product(id: string, name: string, calories: number, protein: number, fat: number, carbs: number): Product {
  return { id, name, calories, protein, fat, carbs, category: 'Тест' };
}

function item(id: string, productValue: Product, quantity: number): MealItem {
  return { id, product: productValue, quantity };
}

function meal(date: string, type: MealType, items: MealItem[]): Meal {
  return { id: `meal-${date}-${type}`, type, items };
}

function record(date: string, itemsByMeal: Partial<Record<MealType, MealItem[]>>): MockDiaryRecord {
  return {
    id: `diary-${date}`,
    userId: USER_ID,
    date,
    meals: MEAL_TYPES.map((type) => meal(date, type, itemsByMeal[type] ?? [])),
  };
}

const A = (): Product => product('p-a', 'A', 100, 10, 5, 20);
const B = (): Product => product('p-b', 'B', 50, 2, 1, 8);
const C = (): Product => product('p-c', 'C', 200, 20, 10, 40);
const D = (): Product => product('p-d', 'D', 10, 1, 1, 1);
const E = (): Product => product('p-e', 'E', 20, 2, 2, 2);

const CUSTOM_SETTINGS: Settings = {
  dailyCalories: 2000,
  dailyProtein: 120,
  dailyFat: 70,
  dailyCarbs: 250,
  weightUnit: 'kg',
  notificationsEnabled: false,
};

function makeSeed(settings: MockSettingsRecord[]): MockDbData {
  return {
    ...emptyMockDbData(),
    users: [{ id: USER_ID, name: 'Алексей', email: 'alex@example.com', password: 'Demo1234!' }],
    settings,
    diary: [
      record(DATE, {
        breakfast: [item('i1', A(), 100), item('i2', B(), 200)],
        lunch: [item('i3', C(), 50)],
      }),
      record(PREV_DATE, {
        breakfast: [item('i4', A(), 50)],
        snack: [item('i5', D(), 100), item('i6', E(), 100)],
      }),
    ],
  };
}

function setup(settings: MockSettingsRecord[] = [{ userId: USER_ID, ...CUSTOM_SETTINGS }]): {
  db: MockDb;
  session: SessionStore;
} {
  configureMockDbSeed(() => structuredClone(makeSeed(settings)));
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

describe('Обработчики dashboard — домен Dashboard', () => {
  beforeEach(() => {
    localStorage.clear();
    resetMockDbSeed();
  });

  afterEach(() => {
    localStorage.clear();
    resetMockDbSeed();
  });

  it('без сессии → 401 «Не авторизован»', () => {
    const { db, session } = setup();
    const error = catchValidation(() => handleDashboardGetDay(db, session, { date: DATE }));
    expect(error.status).toBe(401);
    expect(error.message).toBe(MOCK_MESSAGES.unauthorized);
  });

  it('итоги дня считаются по позициям (граммы учитываются)', () => {
    const { db, session } = setup();
    session.setUserId(USER_ID);
    const data: DashboardData = handleDashboardGetDay(db, session, { date: DATE });

    expect(data.date).toBe(DATE);
    expect(data.totalCalories).toBe(300);
    expect(data.totalProtein).toBe(24);
    expect(data.totalFat).toBe(12);
    expect(data.totalCarbs).toBe(56);
  });

  it('разбивка по приёмам пищи: количество и калории каждого', () => {
    const { db, session } = setup();
    session.setUserId(USER_ID);
    const data = handleDashboardGetDay(db, session, { date: DATE });

    expect(data.meals.map((meal) => meal.type)).toEqual([...MEAL_TYPES]);
    expect(data.meals[0]).toEqual({ type: 'breakfast', calories: 200, itemsCount: 2 });
    expect(data.meals[1]).toEqual({ type: 'lunch', calories: 100, itemsCount: 1 });
    expect(data.meals[2]).toEqual({ type: 'dinner', calories: 0, itemsCount: 0 });
    expect(data.meals[3]).toEqual({ type: 'snack', calories: 0, itemsCount: 0 });
  });

  it('пустой день: нулевые итоги, четыре приёма, продукты из истории', () => {
    const { db, session } = setup();
    session.setUserId(USER_ID);
    const data = handleDashboardGetDay(db, session, { date: '2026-05-05' });

    expect(data.totalCalories).toBe(0);
    expect(data.meals.length).toBe(4);
    expect(data.recentProducts.length).toBeGreaterThan(0);
  });

  it('недавние продукты: уникальны по названию, свежие раньше, максимум 4', () => {
    const { db, session } = setup();
    session.setUserId(USER_ID);
    const data = handleDashboardGetDay(db, session, { date: DATE });

    expect(data.recentProducts.map((product) => product.name)).toEqual(['A', 'B', 'C', 'D']);
  });

  it('нормы берутся из настроек пользователя', () => {
    const { db, session } = setup();
    session.setUserId(USER_ID);
    const data = handleDashboardGetDay(db, session, { date: DATE });

    expect(data.goals).toEqual({ calories: 2000, protein: 120, fat: 70, carbs: 250 });
  });

  it('без записи настроек нормы — значения по умолчанию', () => {
    const { db, session } = setup([]);
    session.setUserId(USER_ID);
    const data = handleDashboardGetDay(db, session, { date: DATE });

    expect(data.goals).toEqual({
      calories: DEFAULT_SETTINGS.dailyCalories,
      protein: DEFAULT_SETTINGS.dailyProtein,
      fat: DEFAULT_SETTINGS.dailyFat,
      carbs: DEFAULT_SETTINGS.dailyCarbs,
    });
  });

  describe('registerDashboardHandlers — конвейер MockApiClient', () => {
    it('getDay через call возвращает агрегат', fakeAsync(() => {
      setup();
      localStorage.setItem(STORAGE_KEYS.session, USER_ID);
      const client = new MockApiClient();
      registerDashboardHandlers(client);

      let data: DashboardData | undefined;
      client.call<DashboardData>('dashboard.getDay', { date: DATE }).then((value) => (data = value));
      tick(500);
      expect(data?.totalCalories).toBe(300);
    }));

    it('401 выходит транспортной формой ApiError', fakeAsync(() => {
      setup();
      const client = new MockApiClient();
      registerDashboardHandlers(client);

      let rejection: unknown = null;
      client
        .call('dashboard.getDay', { date: DATE })
        .catch((error: unknown) => (rejection = error));
      tick(500);
      expect(rejection).toEqual({ status: 401, body: { message: MOCK_MESSAGES.unauthorized } });
    }));
  });
});
