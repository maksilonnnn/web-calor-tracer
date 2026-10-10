import { provideHttpClient, withInterceptors } from '@angular/common/http';
import {
  HttpTestingController,
  provideHttpClientTesting,
} from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';

import { ApiError, PagedResult, Product } from '../../shared/models';
import { apiErrorInterceptor } from '../http/api-error.interceptor';
import { ProductService } from './product.service';

const APPLE: Product = {
  id: 'p1',
  name: 'Яблоко',
  calories: 52,
  protein: 0.3,
  fat: 0.2,
  carbs: 14,
  category: 'Фрукты',
};

const PAGE: PagedResult<Product> = {
  items: [APPLE],
  page: 1,
  pageSize: 20,
  totalCount: 1,
  totalPages: 1,
};

describe('ProductService — сервис домена Products (HttpClient)', () => {
  let service: ProductService;
  let http: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        provideRouter([]),
        provideHttpClient(withInterceptors([apiErrorInterceptor])),
        provideHttpClientTesting(),
      ],
    });
    service = TestBed.inject(ProductService);
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => http.verify());

  it('getPaged без параметров: GET products без page/pageSize', () => {
    let received: PagedResult<Product> | undefined;
    service.getPaged().subscribe((value) => (received = value));

    const request = http.expectOne('products');
    expect(request.request.method).toBe('GET');
    expect(request.request.params.has('page')).toBeFalse();
    expect(request.request.params.has('pageSize')).toBeFalse();
    request.flush(PAGE);

    expect(received).toEqual(PAGE);
  });

  it('getPaged передаёт page и pageSize', () => {
    service.getPaged(2, 5).subscribe();

    const request = http.expectOne(
      (req) =>
        req.url === 'products' &&
        req.params.get('page') === '2' &&
        req.params.get('pageSize') === '5',
    );
    expect(request.request.method).toBe('GET');
    request.flush(PAGE);
  });

  it('отказ бэкенда пробрасывается как ApiError', () => {
    let error: ApiError | undefined;
    service.getPaged().subscribe({ error: (value: ApiError) => (error = value) });

    http
      .expectOne((req) => req.url === 'products')
      .flush({ message: 'Данные заполнены неверно' }, { status: 400, statusText: 'Bad Request' });

    expect(error?.status).toBe(400);
    expect(error?.body.message).toBe('Данные заполнены неверно');
  });
});
