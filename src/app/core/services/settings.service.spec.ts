import { provideHttpClient, withInterceptors } from '@angular/common/http';
import {
  HttpTestingController,
  provideHttpClientTesting,
} from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';

import { ApiError, Settings } from '../../shared/models';
import { apiErrorInterceptor } from '../http/api-error.interceptor';
import { SettingsService } from './settings.service';

const SAVED: Settings = {
  dailyCalories: 2000,
  dailyProtein: 120,
  dailyFat: 70,
  dailyCarbs: 250,
  weightUnit: 'kg',
  notificationsEnabled: false,
};

describe('SettingsService — сервис домена Settings (HttpClient)', () => {
  let service: SettingsService;
  let http: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        provideRouter([]),
        provideHttpClient(withInterceptors([apiErrorInterceptor])),
        provideHttpClientTesting(),
      ],
    });
    service = TestBed.inject(SettingsService);
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => http.verify());

  it('settings изначально null', () => {
    expect(service.settings()).toBeNull();
  });

  it('get: GET settings и заполнение кэша', () => {
    let received: Settings | undefined;
    service.get().subscribe((value) => (received = value));

    const request = http.expectOne('settings');
    expect(request.request.method).toBe('GET');
    request.flush(SAVED);

    expect(received).toEqual(SAVED);
    expect(service.settings()).toEqual(SAVED);
  });

  it('update: PUT settings с частичными полями и обновление кэша', () => {
    let received: Settings | undefined;
    service.update({ weightUnit: 'g' }).subscribe((value) => (received = value));

    const request = http.expectOne('settings');
    expect(request.request.method).toBe('PUT');
    expect(request.request.body).toEqual({ weightUnit: 'g' });
    request.flush({ ...SAVED, weightUnit: 'g' });

    expect(received?.weightUnit).toBe('g');
    expect(service.settings()?.weightUnit).toBe('g');
  });

  it('отказ бэкенда пробрасывается как ApiError, кэш не заполняется', () => {
    let error: ApiError | undefined;
    service.get().subscribe({ error: (value: ApiError) => (error = value) });

    http
      .expectOne('settings')
      .flush({ message: 'Не авторизован' }, { status: 401, statusText: 'Unauthorized' });

    expect(error?.status).toBe(401);
    expect(service.settings()).toBeNull();
  });
});
