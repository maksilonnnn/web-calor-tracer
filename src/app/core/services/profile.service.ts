/**
 * ProfileService — сервис домена Profile для страницы настроек: просмотр и
 * редактирование профиля (имя/email), смена пароля и удаление аккаунта.
 *
 * Отказы мока приходят как ApiError {status, body: {message, errors?}}:
 * 400 «Данные заполнены неверно» с errors по полям, 400 «Неверный текущий
 * пароль», 409 «Пользователь с таким email уже существует», 401 «Не
 * авторизован» — страница показывает body.message дословно.
 */
import { Injectable, inject } from '@angular/core';

import { UserDto } from '../../shared/models';
import {
  ProfileChangePasswordParams,
  ProfileUpdateParams,
} from '../../mock/profile/handlers';
import { MockApiClient } from '../../mock/mock-api-client';

/** Типы контракта Profile, потребляемые страницей настроек. */
export type { ProfileChangePasswordParams, ProfileUpdateParams };

@Injectable({ providedIn: 'root' })
export class ProfileService {
  private readonly client = inject(MockApiClient);

  /** Профиль текущего пользователя сессии. */
  get(): Promise<UserDto> {
    return this.client.call<UserDto>('profile.get', null);
  }

  /** Редактирование имени и email → обновлённый профиль. */
  update(params: ProfileUpdateParams): Promise<UserDto> {
    return this.client.call<UserDto>('profile.update', params);
  }

  /** Смена пароля. */
  changePassword(params: ProfileChangePasswordParams): Promise<void> {
    return this.client.call<void>('profile.changePassword', params);
  }

  /** Удаление аккаунта вместе с его данными. */
  deleteAccount(): Promise<void> {
    return this.client.call<void>('profile.deleteAccount', null);
  }
}
