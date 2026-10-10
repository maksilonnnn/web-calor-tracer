import { provideHttpClient, withInterceptors } from '@angular/common/http';
import {
  HttpTestingController,
  provideHttpClientTesting,
} from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';

import { ApiError, DashboardData } from '../../shared/models';
import { apiErrorInterceptor } from '../http/api-error.interceptor';
import { DashboardService } from './dashboard.service';

const DATA: DashboardData = {
  date: '2026-01-01',
  totalCalories: 1200,
  totalProtein: 80,
  totalFat: 40,
  totalCarbs: 150,
  meals: [],
  recentProducts: [],
  goals: { calories: 2000, protein: 100, fat: 70, carbs: 250 },
};

describe('DashboardService — сервис домена Dashboard (HttpClient)', () => {
  let service: DashboardService;
  let http: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        provideRouter([]),
        provideHttpClient(withInterceptors([apiErrorInterceptor])),
        provideHttpClientTesting(),
      ],
    });
    service = TestBed.inject(DashboardService);
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => http.verify());

  it('getDay: GET dashboard с датой', () => {
    let received: DashboardData | undefined;
    service.getDay('2026-01-01').subscribe((value) => (received = value));

    const request = http.expectOne(
      (req) => req.url === 'dashboard' && req.params.get('date') === '2026-01-01',
    );
    expect(request.request.method).toBe('GET');
    request.flush(DATA);

    expect(received).toEqual(DATA);
  });

  it('отказ бэкенда пробрасывается как ApiError', () => {
    let error: ApiError | undefined;
    service.getDay('2026-01-01').subscribe({ error: (value: ApiError) => (error = value) });

    http
      .expectOne((req) => req.url === 'dashboard')
      .flush({ message: 'Не авторизован' }, { status: 401, statusText: 'Unauthorized' });

    expect(error?.status).toBe(401);
    expect(error?.body.message).toBe('Не авторизован');
  });
});
