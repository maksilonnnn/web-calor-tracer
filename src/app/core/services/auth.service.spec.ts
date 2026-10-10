import { provideHttpClient, withInterceptors } from '@angular/common/http';
import {
  HttpTestingController,
  provideHttpClientTesting,
} from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';

import { ApiError, UserDto } from '../../shared/models';
import { apiErrorInterceptor } from '../http/api-error.interceptor';
import { AuthService } from './auth.service';

const ME: UserDto = { id: 'u1', name: 'Алексей', email: 'alex@example.com' };

describe('AuthService — сервис домена Auth (HttpClient)', () => {
  let service: AuthService;
  let http: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        provideRouter([]),
        provideHttpClient(withInterceptors([apiErrorInterceptor])),
        provideHttpClientTesting(),
      ],
    });
    service = TestBed.inject(AuthService);
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => http.verify());

  it('currentUser изначально null', () => {
    expect(service.currentUser()).toBeNull();
  });

  it('login: POST auth/login, кэш currentUser заполнен', () => {
    let received: UserDto | undefined;
    service.login({ email: 'alex@example.com', password: 'Demo1234!' }).subscribe({
      next: (value) => (received = value),
    });

    const request = http.expectOne('auth/login');
    expect(request.request.method).toBe('POST');
    expect(request.request.body).toEqual({ email: 'alex@example.com', password: 'Demo1234!' });
    request.flush(ME);

    expect(received).toEqual(ME);
    expect(service.currentUser()).toEqual(ME);
  });

  it('login отказ: ApiError 401, кэш пуст', () => {
    let error: ApiError | undefined;
    service.login({ email: 'alex@example.com', password: 'неверный' }).subscribe({
      error: (value: ApiError) => (error = value),
    });

    http
      .expectOne('auth/login')
      .flush({ message: 'Неверный email или пароль' }, { status: 401, statusText: 'Unauthorized' });

    expect(error?.status).toBe(401);
    expect(error?.body.message).toBe('Неверный email или пароль');
    expect(service.currentUser()).toBeNull();
  });

  it('register: POST auth/register, кэш заполнен', () => {
    let received: UserDto | undefined;
    service
      .register({
        name: 'Пётр',
        email: 'petr@example.com',
        password: 'Demo1234!',
        confirmPassword: 'Demo1234!',
      })
      .subscribe({ next: (value) => (received = value) });

    const request = http.expectOne('auth/register');
    expect(request.request.method).toBe('POST');
    request.flush({ id: 'u2', name: 'Пётр', email: 'petr@example.com' });

    expect(received?.email).toBe('petr@example.com');
    expect(service.currentUser()?.email).toBe('petr@example.com');
  });

  it('logout: POST auth/logout, кэш очищен', () => {
    service.login({ email: 'alex@example.com', password: 'Demo1234!' }).subscribe();
    http.expectOne('auth/login').flush(ME);
    expect(service.currentUser()).not.toBeNull();

    service.logout().subscribe();
    const request = http.expectOne('auth/logout');
    expect(request.request.method).toBe('POST');
    request.flush(null);

    expect(service.currentUser()).toBeNull();
  });

  it('loadMe: GET auth/me и кэш', () => {
    let received: UserDto | null = null as UserDto | null;
    service.loadMe().subscribe({ next: (value) => (received = value) });

    const request = http.expectOne('auth/me');
    expect(request.request.method).toBe('GET');
    request.flush(ME);

    expect(received).toEqual(ME);
    expect(service.currentUser()).toEqual(ME);
  });

  it('loadMe при 401 возвращает null и сбрасывает кэш', () => {
    let received: UserDto | null = ME;
    service.loadMe().subscribe({ next: (value) => (received = value) });

    http
      .expectOne('auth/me')
      .flush({ message: 'Не авторизован' }, { status: 401, statusText: 'Unauthorized' });

    expect(received).toBeNull();
    expect(service.currentUser()).toBeNull();
  });
});
