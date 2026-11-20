/**
 * AdminService — админ-API пользователей: постраничный список с поиском и
 * блокировка/разблокировка. Методы защищены на бэкенде ролью admin, поэтому
 * скрытие пункта меню не является мерой безопасности.
 */
import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';

import { AdminUser, PagedResult } from '../../shared/models';

/** Параметры выборки админ-списка. */
export interface AdminUsersQuery {
  page?: number;
  pageSize?: number;
  search?: string;
}

@Injectable({ providedIn: 'root' })
export class AdminService {
  private readonly http = inject(HttpClient);

  /** Постраничный список пользователей с поиском по имени/email. */
  getUsers(query: AdminUsersQuery = {}): Observable<PagedResult<AdminUser>> {
    let params = new HttpParams();
    if (query.page !== undefined) {
      params = params.set('page', query.page);
    }
    if (query.pageSize !== undefined) {
      params = params.set('pageSize', query.pageSize);
    }
    if (query.search !== undefined && query.search.trim() !== '') {
      params = params.set('search', query.search.trim());
    }

    return this.http.get<PagedResult<AdminUser>>('admin/users', { params });
  }

  /** Заблокировать пользователя → обновлённая запись. */
  block(userId: string): Observable<AdminUser> {
    return this.http.put<AdminUser>(`admin/users/${userId}/block`, null);
  }

  /** Разблокировать пользователя → обновлённая запись. */
  unblock(userId: string): Observable<AdminUser> {
    return this.http.put<AdminUser>(`admin/users/${userId}/unblock`, null);
  }
}
