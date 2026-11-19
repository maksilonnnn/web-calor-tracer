import { provideHttpClient, withInterceptors } from '@angular/common/http';
import {
  HttpTestingController,
  provideHttpClientTesting,
} from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';

import { AdminUser, PagedResult } from '../../shared/models';
import { apiErrorInterceptor } from '../http/api-error.interceptor';
import { AdminService } from './admin.service';

const USER: AdminUser = {
  id: 'u1',
  name: 'Алексей',
  email: 'alex@example.com',
  role: 'user',
  isBlocked: false,
  createdAt: '2026-01-01T10:00:00+00:00',
};

const PAGE: PagedResult<AdminUser> = {
  items: [USER],
  page: 1,
  pageSize: 20,
  totalCount: 1,
  totalPages: 1,
};

describe('AdminService — админ-API пользователей (HttpClient)', () => {
  let service: AdminService;
  let http: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        provideRouter([]),
        provideHttpClient(withInterceptors([apiErrorInterceptor])),
        provideHttpClientTesting(),
      ],
    });
    service = TestBed.inject(AdminService);
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => http.verify());

  it('getUsers: GET admin/users с пагинацией и поиском', () => {
    let received: PagedResult<AdminUser> | undefined;
    service.getUsers({ page: 2, pageSize: 10, search: ' alex ' }).subscribe((value) => {
      received = value;
    });

    const request = http.expectOne((req) => req.url === 'admin/users');
    expect(request.request.method).toBe('GET');
    expect(request.request.params.get('page')).toBe('2');
    expect(request.request.params.get('pageSize')).toBe('10');
    expect(request.request.params.get('search')).toBe('alex');
    request.flush(PAGE);

    expect(received).toEqual(PAGE);
  });

  it('getUsers без параметров не добавляет пустой search', () => {
    service.getUsers({ search: '   ' }).subscribe();

    const request = http.expectOne((req) => req.url === 'admin/users');
    expect(request.request.params.has('search')).toBeFalse();
    request.flush(PAGE);
  });

  it('block: PUT admin/users/{id}/block', () => {
    let received: AdminUser | undefined;
    service.block('u1').subscribe((value) => (received = value));

    const request = http.expectOne('admin/users/u1/block');
    expect(request.request.method).toBe('PUT');
    request.flush({ ...USER, isBlocked: true });

    expect(received?.isBlocked).toBeTrue();
  });

  it('unblock: PUT admin/users/{id}/unblock', () => {
    let received: AdminUser | undefined;
    service.unblock('u1').subscribe((value) => (received = value));

    const request = http.expectOne('admin/users/u1/unblock');
    expect(request.request.method).toBe('PUT');
    request.flush(USER);

    expect(received?.isBlocked).toBeFalse();
  });
});
