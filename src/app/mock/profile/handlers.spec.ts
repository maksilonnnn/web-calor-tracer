import { fakeAsync, tick } from '@angular/core/testing';

import { STORAGE_KEYS, UserDto } from '../../shared/models';
import { INVALID_FORM_MESSAGE } from '../../shared/validation/error-texts';
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
import {
  handleProfileChangePassword,
  handleProfileDeleteAccount,
  handleProfileGet,
  handleProfileUpdate,
  registerProfileHandlers,
} from './handlers';

const USER_ID = 'user-0001';
const OTHER_ID = 'user-0002';

function makeSeed(): MockDbData {
  return {
    ...emptyMockDbData(),
    users: [
      { id: USER_ID, name: 'Алексей', email: 'alex@example.com', password: 'Demo1234!' },
      { id: OTHER_ID, name: 'Пётр', email: 'petr@example.com', password: 'Demo1234!' },
    ],
    diary: [
      { id: 'diary-1', userId: USER_ID, date: '2026-01-01', meals: [] } satisfies MockDiaryRecord,
      { id: 'diary-2', userId: OTHER_ID, date: '2026-01-01', meals: [] } satisfies MockDiaryRecord,
    ],
    settings: [
      { userId: USER_ID, ...defaultSettings() },
      { userId: OTHER_ID, ...defaultSettings() },
    ] as MockSettingsRecord[],
  };
}

function defaultSettings(): Omit<MockSettingsRecord, 'userId'> {
  return {
    dailyCalories: 2500,
    dailyProtein: 150,
    dailyFat: 83,
    dailyCarbs: 300,
    weightUnit: 'g',
    notificationsEnabled: true,
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

describe('Обработчики profile — домен Profile', () => {
  beforeEach(() => {
    localStorage.clear();
    resetMockDbSeed();
  });

  afterEach(() => {
    localStorage.clear();
    resetMockDbSeed();
  });

  describe('profile.get', () => {
    it('без сессии → 401 «Не авторизован»', () => {
      const { db, session } = setup();
      const error = catchValidation(() => handleProfileGet(db, session));
      expect(error.status).toBe(401);
      expect(error.message).toBe(MOCK_MESSAGES.unauthorized);
    });

    it('возвращает DTO без пароля', () => {
      const { db, session } = setup();
      session.setUserId(USER_ID);
      const me = handleProfileGet(db, session);
      expect(me).toEqual({ id: USER_ID, name: 'Алексей', email: 'alex@example.com' } satisfies UserDto);
      expect(Object.prototype.hasOwnProperty.call(me, 'password')).toBeFalse();
    });
  });

  describe('profile.update', () => {
    it('успех: имя и email обновляются с тримом', () => {
      const { db, session } = setup();
      session.setUserId(USER_ID);
      const me = handleProfileUpdate(db, session, { name: '  Алексей Н.  ', email: '  new@example.com ' });

      expect(me).toEqual({ id: USER_ID, name: 'Алексей Н.', email: 'new@example.com' });
      expect(db.read().users[0].name).toBe('Алексей Н.');
    });

    it('пустое имя и некорректный email → 400 с ошибками полей', () => {
      const { db, session } = setup();
      session.setUserId(USER_ID);
      const error = catchValidation(() =>
        handleProfileUpdate(db, session, { name: '   ', email: 'не-почта' }),
      );
      expect(error.status).toBe(400);
      expect(error.message).toBe(INVALID_FORM_MESSAGE);
      expect(Object.keys(error.errors ?? {}).sort()).toEqual(['email', 'name']);
    });

    it('email, занятый другим пользователем → 409', () => {
      const { db, session } = setup();
      session.setUserId(USER_ID);
      const error = catchValidation(() =>
        handleProfileUpdate(db, session, { name: 'Алексей', email: 'PETR@example.com' }),
      );
      expect(error.status).toBe(409);
      expect(error.message).toBe(MOCK_MESSAGES.emailTaken);
    });

    it('собственный email (в другом регистре) разрешён', () => {
      const { db, session } = setup();
      session.setUserId(USER_ID);
      const me = handleProfileUpdate(db, session, { name: 'Алексей', email: 'ALEX@example.com' });
      expect(me.email).toBe('ALEX@example.com');
    });

    it('без сессии → 401', () => {
      const { db, session } = setup();
      const error = catchValidation(() =>
        handleProfileUpdate(db, session, { name: 'Алексей', email: 'alex@example.com' }),
      );
      expect(error.status).toBe(401);
    });
  });

  describe('profile.changePassword', () => {
    it('успех: пароль обновляется', () => {
      const { db, session } = setup();
      session.setUserId(USER_ID);
      const result = handleProfileChangePassword(db, session, {
        currentPassword: 'Demo1234!',
        password: 'NewDemo1234!',
        confirmPassword: 'NewDemo1234!',
      });
      expect(result).toBeNull();
      expect(db.read().users[0].password).toBe('NewDemo1234!');
    });

    it('неверный текущий пароль → 400 «Неверный текущий пароль» (до проверки нового)', () => {
      const { db, session } = setup();
      session.setUserId(USER_ID);
      const error = catchValidation(() =>
        handleProfileChangePassword(db, session, {
          currentPassword: 'wrong',
          password: 'short',
          confirmPassword: 'different',
        }),
      );
      expect(error.status).toBe(400);
      expect(error.message).toBe(MOCK_MESSAGES.wrongCurrentPassword);
    });

    it('слабый новый пароль и несовпадение повтора → 400 с ошибками', () => {
      const { db, session } = setup();
      session.setUserId(USER_ID);
      const error = catchValidation(() =>
        handleProfileChangePassword(db, session, {
          currentPassword: 'Demo1234!',
          password: 'short',
          confirmPassword: 'другой',
        }),
      );
      expect(error.status).toBe(400);
      expect(error.errors?.['password']).toBeDefined();
      expect(error.errors?.['confirmPassword']).toEqual(['Пароли не совпадают']);
      expect(db.read().users[0].password).toBe('Demo1234!');
    });

    it('без сессии → 401', () => {
      const { db, session } = setup();
      const error = catchValidation(() =>
        handleProfileChangePassword(db, session, {
          currentPassword: 'Demo1234!',
          password: 'NewDemo1234!',
          confirmPassword: 'NewDemo1234!',
        }),
      );
      expect(error.status).toBe(401);
    });
  });

  describe('profile.deleteAccount', () => {
    it('удаляет пользователя вместе с данными и очищает сессию', () => {
      const { db, session } = setup();
      session.setUserId(USER_ID);
      expect(handleProfileDeleteAccount(db, session)).toBeNull();

      const stored = db.read();
      expect(stored.users.map((user) => user.id)).toEqual([OTHER_ID]);
      expect(stored.diary.map((record) => record.userId)).toEqual([OTHER_ID]);
      expect(stored.settings.map((record) => record.userId)).toEqual([OTHER_ID]);
      expect(session.hasUser()).toBeFalse();
    });

    it('после удаления profile.get по старой сессии → 401', () => {
      const { db, session } = setup();
      session.setUserId(USER_ID);
      handleProfileDeleteAccount(db, session);
      const error = catchValidation(() => handleProfileGet(db, session));
      expect(error.status).toBe(401);
    });

    it('без сессии → 401 и данные не тронуты', () => {
      const { db, session } = setup();
      const error = catchValidation(() => handleProfileDeleteAccount(db, session));
      expect(error.status).toBe(401);
      expect(db.read().users.length).toBe(2);
    });
  });

  describe('registerProfileHandlers — конвейер MockApiClient', () => {
    it('get через call возвращает профиль', fakeAsync(() => {
      setup();
      localStorage.setItem(STORAGE_KEYS.session, USER_ID);
      const client = new MockApiClient();
      registerProfileHandlers(client);

      let me: UserDto | undefined;
      client.call<UserDto>('profile.get', null).then((value) => (me = value));
      tick(500);
      expect(me?.name).toBe('Алексей');
    }));

    it('401 выходит транспортной формой ApiError', fakeAsync(() => {
      setup();
      const client = new MockApiClient();
      registerProfileHandlers(client);

      let rejection: unknown = null;
      client.call('profile.get', null).catch((error: unknown) => (rejection = error));
      tick(500);
      expect(rejection).toEqual({ status: 401, body: { message: MOCK_MESSAGES.unauthorized } });
    }));
  });
});
