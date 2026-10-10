/**
 * DashboardService — сервис домена Dashboard для дашборда: агрегат дня
 * (итоги, разбивка по приёмам пищи, недавние продукты, нормы). Все значения
 * считает бэкенд; страница только отображает их.
 */
import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';

import { DashboardData } from '../../shared/models';

@Injectable({ providedIn: 'root' })
export class DashboardService {
  private readonly http = inject(HttpClient);

  /** Агрегат дня за дату 'YYYY-MM-DD'. */
  getDay(date: string): Observable<DashboardData> {
    const params = new HttpParams().set('date', date);
    return this.http.get<DashboardData>('dashboard', { params });
  }
}
