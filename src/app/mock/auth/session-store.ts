/**
 * SessionStore — доступ к ключу STORAGE_KEYS.session: единственный владелец
 * ключа — домен Auth. Значение — id пользователя из мок-БД либо отсутствие
 * ключа = неавторизован; строка хранится как есть (без JSON-обёртки).
 *
 * Состояния в памяти нет — все операции читают/пишут localStorage напрямую,
 * поэтому любые экземпляры (сервисы core, замыкание registerAuthHandlers,
 * пересоздание после F5) видят одно и то же; проверка isAuthenticated()
 * в guards синхронна именно по наличию ключа.
 */
import { Injectable } from '@angular/core';

import { STORAGE_KEYS } from '../../shared/models';

@Injectable({ providedIn: 'root' })
export class SessionStore {
  /** id пользователя сессии либо null = сессии нет. */
  getUserId(): string | null {
    return localStorage.getItem(STORAGE_KEYS.session);
  }

  /** Ставит сессию (успешный register/login). */
  setUserId(userId: string): void {
    localStorage.setItem(STORAGE_KEYS.session, userId);
  }

  /** Очищает сессию (logout, битая сессия, удаление аккаунта). */
  clear(): void {
    localStorage.removeItem(STORAGE_KEYS.session);
  }

  /** Синхронный признак «пользователь в сессии» — по наличию ключа. */
  hasUser(): boolean {
    return this.getUserId() !== null;
  }
}
