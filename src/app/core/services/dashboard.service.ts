/**
 * DashboardService — сервис домена Dashboard для дашборда: агрегат дня
 * (итоги, разбивка по приёмам пищи, недавние продукты, нормы). Все значения
 * считает мок по данным дневника; страница только отображает их.
 */
import { Injectable, inject } from '@angular/core';

import { DashboardData } from '../../shared/models';
import { MockApiClient } from '../../mock/mock-api-client';

@Injectable({ providedIn: 'root' })
export class DashboardService {
  private readonly client = inject(MockApiClient);

  /** Агрегат дня за дату 'YYYY-MM-DD'. */
  getDay(date: string): Promise<DashboardData> {
    return this.client.call<DashboardData>('dashboard.getDay', { date });
  }
}
