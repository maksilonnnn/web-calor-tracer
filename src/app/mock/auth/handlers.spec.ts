import { fakeAsync, tick } from '@angular/core/testing';

import { ApiError, STORAGE_KEYS, UserDto } from '../../shared/models';
import { MockApiClient } from '../mock-api-client';
import {
  MockDb,
  MockDbData,
  configureMockDbSeed,
  emptyMockDbData,
  resetMockDbSeed,
} from '../mock-db';
import { MockValidationError } from '../mock-error';
import { SessionStore } from './session-store';
import {
  LoginParams,
  RegisterParams,
  handleAuthLogin,
  handleAuthLogout,
  handleAuthMe,
  handleAuthRegister,
  registerAuthHandlers,
} from './handlers';

const ALEX_ID = 'aaaaaaaa-1111-4111-8111-111111111111';

const ALEX: MockDbData['users'][number] = {
  id: ALEX_ID,
  name: 'Алексей',
  email: 'alex@example.com',
  password: 'Demo1234!',
};

const VALID_REGISTER: RegisterParams = {
  name: 'Пётр Петрович',
  email: 'petr@example.com',
  password: 'Demo1234!',
  confirmPassword: 'Demo1234!',
};

function makeSeed(): MockDbData {
  return {
    ...emptyMockDbData(),
    users: [structuredClone(ALEX)],
    settings: [],
  };
}

function setup(seed: MockDbData = makeSeed()): { db: MockDb; session: SessionStore } {
  configureMockDbSeed(() => structuredClone(seed));
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

describe('Обработчики auth — домен Auth', () => {
  beforeEach(() => {
    localStorage.clear();
    resetMockDbSeed();
  });

  afterEach(() => {
    localStorage.clear();
    resetMockDbSeed();
  });

  describe('auth.register', () => {
    it('успех: создаёт пользователя, ставит сессию, возвращает DTO без пароля', () => {
      const { db, session } = setup();
      const me = handleAuthRegister(db, session, VALID_REGISTER);

      expect(me).toEqual({ id: me.id, name: 'Пётр Петрович', email: 'petr@example.com' } satisfies UserDto);
      expect(Object.keys(me)).not.toContain('password');
      expect(session.getUserId()).toBe(me.id);
      expect(db.read().users.length).toBe(2);
    });

    it('пустая форма: 400 с ошибками по всем полям', () => {
      const { db, session } = setup();
      const error = catchValidation(() =>
        handleAuthRegister(db, session, { name: '', email: '', password: '', confirmPassword: '' }),
      );
      expect(error.status).toBe(400);
      expect(error.message).toBe('Данные заполнены неверно');
      expect(Object.keys(error.errors ?? {}).sort()).toEqual([
        'confirmPassword',
        'email',
        'name',
        'password',
      ]);
      expect(db.read().users.length).toBe(1);
      expect(session.hasUser()).toBeFalse();
    });

    it('некорректный email и несовпадение паролей — тексты из словаря', () => {
      const { db, session } = setup();
      const error = catchValidation(() =>
        handleAuthRegister(db, session, { ...VALID_REGISTER, email: 'не-почта', confirmPassword: 'другой' }),
      );
      expect(error.errors?.['email']).toEqual(['Введите корректный email']);
      expect(error.errors?.['confirmPassword']).toEqual(['Пароли не совпадают']);
    });

    it('дубликат email без учёта регистра → 409', () => {
      const { db, session } = setup();
      const error = catchValidation(() =>
        handleAuthRegister(db, session, { ...VALID_REGISTER, email: 'ALEX@EXAMPLE.COM' }),
      );
      expect(error.status).toBe(409);
      expect(error.message).toBe('Пользователь с таким email уже существует');
      expect(db.read().users.length).toBe(1);
    });
  });

  describe('auth.login', () => {
    const LOGIN: LoginParams = { email: 'alex@example.com', password: 'Demo1234!' };

    it('успех: email без учёта регистра, сессия установлена', () => {
      const { db, session } = setup();
      const me = handleAuthLogin(db, session, { ...LOGIN, email: 'Alex@Example.com' });
      expect(me).toEqual({ id: ALEX_ID, name: 'Алексей', email: 'alex@example.com' });
      expect(session.getUserId()).toBe(ALEX_ID);
    });

    it('неверная комбинация — единый 401 «Неверный email или пароль»', () => {
      const { db, session } = setup();
      for (const params of [
        { email: 'alex@example.com', password: 'неверный' },
        { email: 'ghost@example.com', password: 'Demo1234!' },
        { email: '', password: '' },
      ]) {
        const error = catchValidation(() => handleAuthLogin(db, session, params));
        expect(error.status).toBe(401);
        expect(error.message).toBe('Неверный email или пароль');
      }
      expect(session.hasUser()).toBeFalse();
    });
  });

  describe('auth.me / auth.logout', () => {
    it('me по сессии возвращает DTO пользователя', () => {
      const { db, session } = setup();
      session.setUserId(ALEX_ID);
      expect(handleAuthMe(db, session)).toEqual({
        id: ALEX_ID,
        name: 'Алексей',
        email: 'alex@example.com',
      });
    });

    it('me без сессии → 401 «Не авторизован»', () => {
      const { db, session } = setup();
      const error = catchValidation(() => handleAuthMe(db, session));
      expect(error.status).toBe(401);
      expect(error.message).toBe('Не авторизован');
    });

    it('me с битой сессией → 401 и сессия очищена', () => {
      const { db, session } = setup();
      session.setUserId('ffffffff-ffff-4fff-8fff-ffffffffffff');
      catchValidation(() => handleAuthMe(db, session));
      expect(session.hasUser()).toBeFalse();
    });

    it('logout очищает сессию; без сессии — тоже успех', () => {
      const { session } = setup();
      session.setUserId(ALEX_ID);
      expect(handleAuthLogout(session)).toBeNull();
      expect(session.hasUser()).toBeFalse();
      expect(handleAuthLogout(session)).toBeNull();
    });
  });

  describe('registerAuthHandlers — конвейер MockApiClient', () => {
    function clientWithHandlers(): MockApiClient {
      const client = new MockApiClient();
      registerAuthHandlers(client);
      return client;
    }

    it('login через call: успех и ставка сессии', fakeAsync(() => {
      setup();
      const client = clientWithHandlers();
      let me: UserDto | undefined;
      client
        .call<UserDto>('auth.login', { email: 'alex@example.com', password: 'Demo1234!' })
        .then((value) => (me = value));
      tick(500);
      expect(me?.email).toBe('alex@example.com');
    }));

    it('401 выходит транспортной формой ApiError', fakeAsync(() => {
      setup();
      const client = clientWithHandlers();
      let rejection: unknown = null;
      client
        .call('auth.login', { email: 'ghost@example.com', password: 'x' })
        .catch((error: unknown) => (rejection = error));
      tick(500);
      expect(rejection).toEqual({
        status: 401,
        body: { message: 'Неверный email или пароль' },
      } satisfies ApiError);
      expect(localStorage.getItem(STORAGE_KEYS.session)).toBeNull();
    }));
  });
});
