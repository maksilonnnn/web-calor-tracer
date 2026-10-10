/**
 * AuthService — сервис домена Auth для страниц: регистрация, вход, выход,
 * текущий пользователь. Работает поверх HttpClient; JWT хранится в
 * httpOnly-cookie (его ставит и снимает бэкенд), поэтому фронтенд не хранит
 * ни токен, ни идентификатор пользователя в localStorage.
 *
 * Гарантии:
 *  - login/register при успехе обновляют кэш currentUser (сигнал);
 *  - logout сбрасывает кэш (cookie удаляет бэкенд);
 *  - loadMe читает GET /auth/me; 401 → кэш сбрасывается, возвращается null;
 *  - clearSession нужен интерцептору ошибок при 401 на защищённых запросах.
 */
import { HttpClient } from '@angular/common/http';
import { Injectable, inject, signal } from '@angular/core';
import { Observable, catchError, map, of, tap, throwError } from 'rxjs';

import { isApiError } from '../../shared/api-error';
import { LoginParams, RegisterParams, UserDto } from '../../shared/models';

/** Типы контракта Auth, потребляемые страницами и guards. */
export type { LoginParams, RegisterParams };
export type { UserDto as MeDto };

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly http = inject(HttpClient);

  /** Приватный кэш текущего пользователя; мутируют только методы сервиса. */
  private readonly currentUserState = signal<UserDto | null>(null);

  /** Кэш текущего пользователя; null = не загружен/не авторизован. */
  readonly currentUser = this.currentUserState.asReadonly();

  /** Вход: успех → обновление кэша currentUser; отказ — ApiError. */
  login(params: LoginParams): Observable<UserDto> {
    return this.http
      .post<UserDto>('auth/login', params)
      .pipe(tap((me) => this.setCurrentUser(me)));
  }

  /** Регистрация: успех → автоматический вход. */
  register(params: RegisterParams): Observable<UserDto> {
    return this.http
      .post<UserDto>('auth/register', params)
      .pipe(tap((me) => this.setCurrentUser(me)));
  }

  /** Выход: бэкенд удаляет cookie, кэш сбрасывается. */
  logout(): Observable<void> {
    return this.http.post<void>('auth/logout', null).pipe(tap(() => this.clearSession()));
  }

  /**
   * Текущий пользователь (догрузка после F5). Всегда обращается к
   * GET /auth/me и кэширует результат в сигнале; 401 (нет/битая сессия) →
   * кэш сброшен, null. Используется guards и обновлением профиля.
   */
  loadMe(): Observable<UserDto | null> {
    return this.http.get<UserDto>('auth/me').pipe(
      tap((me) => this.currentUserState.set(me)),
      map((me): UserDto | null => me),
      catchError((error: unknown) => {
        if (isApiError(error) && error.status === 401) {
          this.clearSession();
          return of(null);
        }
        return throwError(() => error);
      }),
    );
  }

  /** Сбрасывает кэш текущего пользователя (logout, 401 на защищённом запросе). */
  clearSession(): void {
    this.currentUserState.set(null);
  }

  private setCurrentUser(user: UserDto): void {
    this.currentUserState.set(user);
  }
}
