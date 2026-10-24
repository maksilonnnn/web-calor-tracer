import { TestBed, fakeAsync, tick } from '@angular/core/testing';

import { Settings, STORAGE_KEYS } from '../../shared/models';
import { registerSettingsHandlers } from '../../mock/settings/handlers';
import { MockApiClient } from '../../mock/mock-api-client';
import {
  MockDbData,
  configureMockDbSeed,
  emptyMockDbData,
  resetMockDbSeed,
} from '../../mock/mock-db';
import { SettingsService } from './settings.service';

const USER_ID = 'user-0001';

const SAVED: Settings = {
  dailyCalories: 2000,
  dailyProtein: 120,
  dailyFat: 70,
  dailyCarbs: 250,
  weightUnit: 'kg',
  notificationsEnabled: false,
};

function makeSeed(): MockDbData {
  return {
    ...emptyMockDbData(),
    users: [{ id: USER_ID, name: 'Алексей', email: 'alex@example.com', password: 'Demo1234!' }],
    settings: [{ userId: USER_ID, ...SAVED }],
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

describe('SettingsService — сервис домена Settings', () => {
  let service: SettingsService;

  beforeEach(() => {
    localStorage.clear();
    resetMockDbSeed();
    configureMockDbSeed(() => structuredClone(makeSeed()));
    localStorage.setItem(STORAGE_KEYS.session, USER_ID);
    TestBed.configureTestingModule({});
    registerSettingsHandlers(TestBed.inject(MockApiClient));
    service = TestBed.inject(SettingsService);
  });

  afterEach(() => {
    localStorage.clear();
    resetMockDbSeed();
  });

  it('settings изначально null', () => {
    expect(service.settings()).toBeNull();
  });

  it('get возвращает настройки и заполняет кэш', fakeAsync(() => {
    const box = capture(service.get());
    tick(500);
    expect(box.value).toEqual(SAVED);
    expect(service.settings()).toEqual(SAVED);
  }));

  it('update частично меняет настройки и обновляет кэш', fakeAsync(() => {
    capture(service.get());
    tick(500);

    const box = capture(service.update({ weightUnit: 'g' }));
    tick(500);
    expect(box.value?.weightUnit).toBe('g');
    expect(box.value?.notificationsEnabled).toBe(false);
    expect(service.settings()?.weightUnit).toBe('g');
  }));
});
