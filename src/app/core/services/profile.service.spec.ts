import { provideHttpClient, withInterceptors } from '@angular/common/http';
import {
  HttpTestingController,
  provideHttpClientTesting,
} from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';

import { ApiError, UserDto } from '../../shared/models';
import { apiErrorInterceptor } from '../http/api-error.interceptor';
import { ProfileService } from './profile.service';

const ME: UserDto = { id: 'user-1', name: 'Алексей', email: 'alex@example.com' };

describe('ProfileService — сервис домена Profile (HttpClient)', () => {
  let service: ProfileService;
  let http: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        provideRouter([]),
        provideHttpClient(withInterceptors([apiErrorInterceptor])),
        provideHttpClientTesting(),
      ],
    });
    service = TestBed.inject(ProfileService);
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => http.verify());

  it('get: GET me', () => {
    let received: UserDto | undefined;
    service.get().subscribe((value) => (received = value));

    const request = http.expectOne('me');
    expect(request.request.method).toBe('GET');
    request.flush(ME);

    expect(received).toEqual(ME);
  });

  it('update: PUT me с именем и email', () => {
    const params = { name: 'Алексей Н.', email: 'new@example.com' };
    let received: UserDto | undefined;
    service.update(params).subscribe((value) => (received = value));

    const request = http.expectOne('me');
    expect(request.request.method).toBe('PUT');
    expect(request.request.body).toEqual(params);
    request.flush({ id: 'user-1', ...params });

    expect(received?.email).toBe('new@example.com');
  });

  it('changePassword: PUT me/password со всеми тремя полями', () => {
    const params = {
      currentPassword: 'Demo1234!',
      password: 'NewDemo1234!',
      confirmPassword: 'NewDemo1234!',
    };
    service.changePassword(params).subscribe();

    const request = http.expectOne('me/password');
    expect(request.request.method).toBe('PUT');
    expect(request.request.body).toEqual(params);
    request.flush(null);
  });

  it('deleteAccount: DELETE me', () => {
    service.deleteAccount().subscribe();

    const request = http.expectOne('me');
    expect(request.request.method).toBe('DELETE');
    request.flush(null);
  });

  it('отказ бэкенда пробрасывается как ApiError', () => {
    let error: ApiError | undefined;
    service
      .update({ name: 'A', email: 'a@b.c' })
      .subscribe({ error: (value: ApiError) => (error = value) });

    http.expectOne('me').flush(
      { message: 'Пользователь с таким email уже существует' },
      { status: 409, statusText: 'Conflict' },
    );

    expect(error?.status).toBe(409);
    expect(error?.body.message).toBe('Пользователь с таким email уже существует');
  });
});
