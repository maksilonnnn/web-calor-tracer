import { fakeAsync, tick } from '@angular/core/testing';

import { MOCK_DELAY_MS, STORAGE_KEYS } from '../shared/models';
import { MockApiClient } from './mock-api-client';
import { MockDbData, resetMockDbSeed } from './mock-db';
import { setupMockLayer } from './index';

const DB_KEY = STORAGE_KEYS.mockDb;

function storedDb(): MockDbData {
  return JSON.parse(localStorage.getItem(DB_KEY) ?? 'null') as MockDbData;
}

/** Полный реестр доменных методов с минимальными параметрами. */
function allDomainMethods(): Array<[method: string, params: unknown]> {
  return [
    [
      'auth.register',
      { name: 'Новенький', email: 'newuser@example.com', password: 'Demo1234!', confirmPassword: 'Demo1234!' },
    ],
    ['auth.login', { email: 'alex@example.com', password: 'Demo1234!' }],
    ['auth.logout', null],
    ['auth.me', null],
    ['diary.getDay', { date: '2026-01-01' }],
    [
      'diary.addFood',
      {
        date: '2026-01-01',
        mealType: 'breakfast',
        product: { name: 'Яблоко', calories: 52, protein: 0.3, fat: 0.2, carbs: 14 },
        quantity: 100,
      },
    ],
    ['diary.updateQuantity', { itemId: 'missing', quantity: 100 }],
    ['diary.removeItem', { itemId: 'missing' }],
    ['dashboard.getDay', { date: '2026-01-01' }],
    ['settings.get', null],
    ['settings.update', { weightUnit: 'kg' }],
    ['profile.get', null],
    ['profile.update', { name: 'Алексей', email: 'alex@example.com' }],
    [
      'profile.changePassword',
      { currentPassword: 'Demo1234!', password: 'NewDemo1234!', confirmPassword: 'NewDemo1234!' },
    ],
    ['profile.deleteAccount', null],
  ];
}

describe('setupMockLayer — агрегатор мок-слоя', () => {
  let client: MockApiClient;

  beforeEach(() => {
    localStorage.clear();
    client = new MockApiClient();
  });

  afterEach(() => {
    localStorage.clear();
    resetMockDbSeed();
  });

  it('ни один из 15 доменных методов не отвечает «обработчик не зарегистрирован»', fakeAsync(() => {
    setupMockLayer(client);
    const methods = allDomainMethods();
    expect(methods.length).toBe(15);

    for (const [method, params] of methods) {
      let failure: unknown = null;
      client.call(method, params).catch((error: unknown) => (failure = error));
      tick(MOCK_DELAY_MS);
      const message = failure instanceof Error ? failure.message : '';
      expect(message).withContext(`метод ${method}`).not.toContain('не зарегистрирован');
    }
  }));

  it('setupMockLayer без клиента вне инжекционного контекста падает сразу', () => {
    expect(() => setupMockLayer()).toThrow();
  });

  it('повторный setupMockLayer идемпотентен: вызовы продолжают работать', fakeAsync(() => {
    setupMockLayer(client);
    setupMockLayer(client);

    let failure: unknown = null;
    client
      .call('auth.login', { email: 'alex@example.com', password: 'Demo1234!' })
      .then(() => undefined, (error: unknown) => (failure = error));
    tick(MOCK_DELAY_MS);
    expect(failure).toBeNull();
  }));

  it('первый вызов через клиент инициализирует mockDb полным сидом', fakeAsync(() => {
    expect(localStorage.getItem(DB_KEY)).toBeNull();
    setupMockLayer(client);

    let failure: unknown = null;
    client
      .call('auth.login', { email: 'alex@example.com', password: 'Demo1234!' })
      .then(() => undefined, (error: unknown) => (failure = error));
    tick(MOCK_DELAY_MS);
    expect(failure).toBeNull();

    const db = storedDb();
    expect(db.users.length).toBe(1);
    expect(db.diary.length).toBe(3);
    expect(db.settings.length).toBe(1);
  }));
});
