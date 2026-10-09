/**
 * AuthService — сервис домена Auth для страниц: регистрация, вход, выход,
 * текущий пользователь поверх MockApiClient.call. Страницы работают только
 * с этим сервисом; мок-слой скрыт внутри (при замене мока на HTTP страница
 * не меняется).
 *
 * Гарантии:
 *  - register/login при успехе ставят сессию (мок) и обновляют кэш
 *    currentUser;
 *  - logout очищает сессию и кэш;
 *  - loadMe при отсутствии/битой сессии очищает её и возвращает null;
 *  - isAuthenticated() — синхронно по наличию ключа сессии.
 */
import { Injectable, inject, signal } from '@angular/core';

import { SessionStore } from '../../mock/auth/session-store';
import { LoginParams, RegisterParams } from '../../mock/auth/handlers';
import { MockApiClient } from '../../mock/mock-api-client';
import { isApiError } from '../../shared/api-error';
import { UserDto } from '../../shared/models';

/** Типы контракта Auth, потребляемые страницами и guards. */
export type { LoginParams, RegisterParams };
export type { UserDto as MeDto };

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly client = inject(MockApiClient);
  private readonly session = inject(SessionStore);

  /** Приватный кэш текущего пользователя; мутируют только методы сервиса. */
  private readonly currentUserState = signal<UserDto | null>(null);

  /** Кэш текущего пользователя; null = не загружен/не авторизован. */
  readonly currentUser = this.currentUserState.asReadonly();

  /** Синхронная проверка сессии по наличию ключа. */
  isAuthenticated(): boolean {
    return this.session.hasUser();
  }

  /** Вход: успех → сессия + кэш currentUser; отказ — ApiError. */
  async login(params: LoginParams): Promise<UserDto> {
    const me = await this.client.call<UserDto>('auth.login', params);
    this.currentUserState.set(me);
    return me;
  }

  /** Регистрация: успех → автоматический вход. */
  async register(params: RegisterParams): Promise<UserDto> {
    const me = await this.client.call<UserDto>('auth.register', params);
    this.currentUserState.set(me);
    return me;
  }

  /** Выход: сессия очищается моком, кэш — здесь. */
  async logout(): Promise<void> {
    await this.client.call('auth.logout', null);
    this.currentUserState.set(null);
  }

  /**
   * Загружает текущего пользователя (догрузка после F5). Нет сессии — null
   * без вызова; битая сессия (401) — очищается, кэш сбрасывается, null.
   */
  async loadMe(): Promise<UserDto | null> {
    if (!this.session.hasUser()) {
      this.currentUserState.set(null);
      return null;
    }
    try {
      const me = await this.client.call<UserDto>('auth.me', null);
      this.currentUserState.set(me);
      return me;
    } catch (error: unknown) {
      if (isApiError(error) && error.status === 401) {
        this.session.clear();
        this.currentUserState.set(null);
        return null;
      }
      throw error;
    }
  }
}
