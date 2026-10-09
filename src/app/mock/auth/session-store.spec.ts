import { STORAGE_KEYS } from '../../shared/models';
import { SessionStore } from './session-store';

describe('SessionStore — сессия mock-пользователя', () => {
  beforeEach(() => localStorage.clear());

  afterEach(() => localStorage.clear());

  it('без ключа getUserId → null и hasUser → false', () => {
    const store = new SessionStore();
    expect(store.getUserId()).toBeNull();
    expect(store.hasUser()).toBeFalse();
  });

  it('setUserId пишет ключ как есть, getUserId/hasUser видят значение', () => {
    const store = new SessionStore();
    const userId = '0b0b0b0b-0b0b-4b0b-8b0b-0b0b0b0b0b0b';
    store.setUserId(userId);
    expect(store.getUserId()).toBe(userId);
    expect(store.hasUser()).toBeTrue();
    expect(localStorage.getItem(STORAGE_KEYS.session)).toBe(userId);
  });

  it('clear удаляет ключ', () => {
    const store = new SessionStore();
    store.setUserId('0b0b0b0b-0b0b-4b0b-8b0b-0b0b0b0b0b0b');
    store.clear();
    expect(store.getUserId()).toBeNull();
    expect(store.hasUser()).toBeFalse();
    expect(localStorage.getItem(STORAGE_KEYS.session)).toBeNull();
  });

  it('clear без сессии — тоже успех', () => {
    const store = new SessionStore();
    expect(() => store.clear()).not.toThrow();
    expect(store.hasUser()).toBeFalse();
  });

  it('перезозданный экземпляр видит сессию первого (состояние — в localStorage)', () => {
    const first = new SessionStore();
    first.setUserId('0b0b0b0b-0b0b-4b0b-8b0b-0b0b0b0b0b0b');

    const second = new SessionStore();
    expect(second.hasUser()).toBeTrue();

    second.clear();
    expect(first.hasUser()).toBeFalse();
  });
});
