/**
 * ProfileService — сервис домена Profile для страницы настроек: просмотр и
 * редактирование профиля (имя/email), смена пароля и удаление аккаунта.
 *
 * Отказы бэкенда приходят как ApiError {status, body: {message, errors?}}:
 * 400 «Данные заполнены неверно» с errors по полям, 400 «Неверный текущий
 * пароль», 409 «Пользователь с таким email уже существует», 401 «Не
 * авторизован» — страница показывает body.message дословно.
 */
import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';

import {
  ProfileChangePasswordParams,
  ProfileUpdateParams,
  UserDto,
} from '../../shared/models';

/** Типы контракта Profile, потребляемые страницей настроек. */
export type { ProfileChangePasswordParams, ProfileUpdateParams };

@Injectable({ providedIn: 'root' })
export class ProfileService {
  private readonly http = inject(HttpClient);

  /** Профиль текущего пользователя. */
  get(): Observable<UserDto> {
    return this.http.get<UserDto>('me');
  }

  /** Редактирование имени и email → обновлённый профиль. */
  update(params: ProfileUpdateParams): Observable<UserDto> {
    return this.http.put<UserDto>('me', params);
  }

  /** Смена пароля. */
  changePassword(params: ProfileChangePasswordParams): Observable<void> {
    return this.http.put<void>('me/password', params);
  }

  /** Удаление аккаунта вместе с его данными. */
  deleteAccount(): Observable<void> {
    return this.http.delete<void>('me');
  }
}
