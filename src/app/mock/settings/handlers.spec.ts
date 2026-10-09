import { fakeAsync, tick } from '@angular/core/testing';

import { DEFAULT_SETTINGS, Settings, STORAGE_KEYS, WeightUnit } from '../../shared/models';
import { INVALID_FORM_MESSAGE } from '../../shared/validation/error-texts';
import { MockApiClient } from '../mock-api-client';
import {
  MockDb,
  MockDbData,
  MockSettingsRecord,
  configureMockDbSeed,
  emptyMockDbData,
  resetMockDbSeed,
} from '../mock-db';
import { MOCK_MESSAGES, MockValidationError } from '../mock-error';
import { SessionStore } from '../auth/session-store';
import { handleSettingsGet, handleSettingsUpdate, registerSettingsHandlers } from './handlers';

const USER_ID = 'user-0001';

const SAVED: Settings = {
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
  };
}

function setup(settings: MockSettingsRecord[] = [{ userId: USER_ID, ...SAVED }]): {
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

describe('Обработчики settings — домен Settings', () => {
  beforeEach(() => {
    localStorage.clear();
    resetMockDbSeed();
  });

  afterEach(() => {
    localStorage.clear();
    resetMockDbSeed();
  });

  describe('settings.get', () => {
    it('без сессии → 401 «Не авторизован»', () => {
      const { db, session } = setup();
      const error = catchValidation(() => handleSettingsGet(db, session));
      expect(error.status).toBe(401);
      expect(error.message).toBe(MOCK_MESSAGES.unauthorized);
    });

    it('существующая запись возвращается без служебного userId', () => {
      const { db, session } = setup();
      session.setUserId(USER_ID);
      const settings = handleSettingsGet(db, session);

      expect(settings).toEqual(SAVED);
      expect(Object.prototype.hasOwnProperty.call(settings, 'userId')).toBeFalse();
    });

    it('без записи — настройки по умолчанию', () => {
      const { db, session } = setup([]);
      session.setUserId(USER_ID);
      expect(handleSettingsGet(db, session)).toEqual(DEFAULT_SETTINGS);
    });
  });

  describe('settings.update', () => {
    it('частичное обновление единицы веса сохраняется', () => {
      const { db, session } = setup();
      session.setUserId(USER_ID);
      const settings = handleSettingsUpdate(db, session, { weightUnit: 'g' });

      expect(settings.weightUnit).toBe('g');
      expect(settings.notificationsEnabled).toBe(false);
      expect(db.read().settings[0].weightUnit).toBe('g');
    });

    it('без записи настроек обновление создаёт её лениво', () => {
      const { db, session } = setup([]);
      session.setUserId(USER_ID);
      const settings = handleSettingsUpdate(db, session, { notificationsEnabled: true });

      expect(settings).toEqual({ ...DEFAULT_SETTINGS, notificationsEnabled: true });
      expect(db.read().settings.length).toBe(1);
      expect(db.read().settings[0].userId).toBe(USER_ID);
    });

    it('недопустимая единица веса → 400 с ошибкой поля', () => {
      const { db, session } = setup();
      session.setUserId(USER_ID);
      const error = catchValidation(() =>
        handleSettingsUpdate(db, session, { weightUnit: 'lb' as unknown as WeightUnit }),
      );
      expect(error.status).toBe(400);
      expect(error.message).toBe(INVALID_FORM_MESSAGE);
      expect(error.errors?.['weightUnit']).toEqual(['Некорректное значение']);
    });

    it('небулево значение уведомлений → 400 с ошибкой поля', () => {
      const { db, session } = setup();
      session.setUserId(USER_ID);
      const error = catchValidation(() =>
        handleSettingsUpdate(db, session, { notificationsEnabled: 'yes' as unknown as boolean }),
      );
      expect(error.status).toBe(400);
      expect(error.errors?.['notificationsEnabled']).toEqual(['Некорректное значение']);
    });

    it('без сессии → 401', () => {
      const { db, session } = setup();
      const error = catchValidation(() => handleSettingsUpdate(db, session, { weightUnit: 'g' }));
      expect(error.status).toBe(401);
    });
  });

  describe('registerSettingsHandlers — конвейер MockApiClient', () => {
    it('get через call возвращает настройки', fakeAsync(() => {
      setup();
      localStorage.setItem(STORAGE_KEYS.session, USER_ID);
      const client = new MockApiClient();
      registerSettingsHandlers(client);

      let settings: Settings | undefined;
      client.call<Settings>('settings.get', null).then((value) => (settings = value));
      tick(500);
      expect(settings?.weightUnit).toBe('kg');
    }));

    it('401 выходит транспортной формой ApiError', fakeAsync(() => {
      setup();
      const client = new MockApiClient();
      registerSettingsHandlers(client);

      let rejection: unknown = null;
      client.call('settings.get', null).catch((error: unknown) => (rejection = error));
      tick(500);
      expect(rejection).toEqual({ status: 401, body: { message: MOCK_MESSAGES.unauthorized } });
    }));
  });
});
