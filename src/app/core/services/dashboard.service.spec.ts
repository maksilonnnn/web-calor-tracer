import { TestBed } from '@angular/core/testing';

import { DashboardData } from '../../shared/models';
import { MockApiClient } from '../../mock/mock-api-client';
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

describe('DashboardService — сервис домена Dashboard', () => {
  let service: DashboardService;
  let client: MockApiClient;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    client = TestBed.inject(MockApiClient);
    service = TestBed.inject(DashboardService);
  });

  it('getDay вызывает dashboard.getDay с датой', async () => {
    const spy = spyOn(client, 'call').and.returnValue(Promise.resolve(DATA));

    expect(await service.getDay('2026-01-01')).toBe(DATA);
    expect(spy).toHaveBeenCalledWith('dashboard.getDay', { date: '2026-01-01' });
  });

  it('отказ мока пробрасывается как ApiError', async () => {
    const apiError = { status: 401, body: { message: 'Не авторизован' } };
    spyOn(client, 'call').and.returnValue(Promise.reject(apiError));
    await expectAsync(service.getDay('2026-01-01')).toBeRejectedWith(apiError);
  });
});
