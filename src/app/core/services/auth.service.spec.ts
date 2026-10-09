import { TestBed } from '@angular/core/testing';
import { fakeAsync, tick } from '@angular/core/testing';

import { ApiError, STORAGE_KEYS, UserDto } from '../../shared/models';
import { registerAuthHandlers } from '../../mock/auth/handlers';
import { SessionStore } from '../../mock/auth/session-store';
import { MockApiClient } from '../../mock/mock-api-client';
import {
  MockDbData,
  configureMockDbSeed,
  emptyMockDbData,
  resetMockDbSeed,
} from '../../mock/mock-db';
import { AuthService } from './auth.service';

const ALEX_ID = 'user-0001';

function makeSeed(): MockDbData {
  return {
    ...emptyMockDbData(),
    users: [{ id: ALEX_ID, name: 'Алексей', email: 'alex@example.com', password: 'Demo1234!' }],
  };
}

function capture<T>(promise: Promise<T>): { value?: T; error?: unknown } {
  const box: { value?: T; error?: unknown } = {};
  promise.then(
    (value) => (box.value = value),
    (error: unknown) => (box.error = error),
  );
  return box;
}

describe('AuthService — сервис домена Auth', () => {
  let service: AuthService;
  let session: SessionStore;

  beforeEach(() => {
    localStorage.clear();
    resetMockDbSeed();
    configureMockDbSeed(() => structuredClone(makeSeed()));
    TestBed.configureTestingModule({});
    registerAuthHandlers(TestBed.inject(MockApiClient));
    service = TestBed.inject(AuthService);
    session = TestBed.inject(SessionStore);
  });

  afterEach(() => {
    localStorage.clear();
    resetMockDbSeed();
  });

  it('currentUser изначально null, isAuthenticated — по ключу сессии', () => {
    expect(service.currentUser()).toBeNull();
    expect(service.isAuthenticated()).toBeFalse();
    session.setUserId(ALEX_ID);
    expect(service.isAuthenticated()).toBeTrue();
  });

  it('login успех: сессия и кэш currentUser заполнены', fakeAsync(() => {
    const box = capture(service.login({ email: 'alex@example.com', password: 'Demo1234!' }));
    tick(500);
    expect(box.value).toEqual({ id: ALEX_ID, name: 'Алексей', email: 'alex@example.com' });
    expect(service.currentUser()).toEqual(box.value as UserDto);
    expect(service.isAuthenticated()).toBeTrue();
  }));

  it('login отказ: ApiError, кэш и сессия пусты', fakeAsync(() => {
    const box = capture(service.login({ email: 'alex@example.com', password: 'неверный' }));
    tick(500);
    expect((box.error as ApiError).status).toBe(401);
    expect(service.currentUser()).toBeNull();
    expect(service.isAuthenticated()).toBeFalse();
  }));

  it('register успех: пользователь создан, сессия и кэш заполнены', fakeAsync(() => {
    const box = capture(
      service.register({
        name: 'Пётр',
        email: 'petr@example.com',
        password: 'Demo1234!',
        confirmPassword: 'Demo1234!',
      }),
    );
    tick(500);
    expect(box.value?.email).toBe('petr@example.com');
    expect(service.currentUser()?.email).toBe('petr@example.com');
    expect(service.isAuthenticated()).toBeTrue();
  }));

  it('logout очищает сессию и кэш', fakeAsync(() => {
    session.setUserId(ALEX_ID);
    const login = capture(service.login({ email: 'alex@example.com', password: 'Demo1234!' }));
    tick(500);
    expect(service.currentUser()).not.toBeNull();

    const logout = capture(service.logout());
    tick(500);
    expect(logout.value).toBeUndefined();
    expect(service.currentUser()).toBeNull();
    expect(session.hasUser()).toBeFalse();
  }));

  it('loadMe без сессии возвращает null и не трогает кэш', fakeAsync(() => {
    const box = capture(service.loadMe());
    tick(500);
    expect(box.value).toBeNull();
    expect(service.currentUser()).toBeNull();
    expect(localStorage.getItem(STORAGE_KEYS.session)).toBeNull();
  }));

  it('loadMe с сессией загружает пользователя в кэш', fakeAsync(() => {
    session.setUserId(ALEX_ID);
    const box = capture(service.loadMe());
    tick(500);
    expect(box.value?.id).toBe(ALEX_ID);
    expect(service.currentUser()?.name).toBe('Алексей');
  }));

  it('loadMe с битой сессией очищает её и возвращает null', fakeAsync(() => {
    session.setUserId('ghost-user');
    const box = capture(service.loadMe());
    tick(500);
    expect(box.value).toBeNull();
    expect(box.error).toBeUndefined();
    expect(service.currentUser()).toBeNull();
    expect(session.hasUser()).toBeFalse();
  }));
});
