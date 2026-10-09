/**
 * SettingsService — сервис домена Settings для страниц: чтение и частичное
 * обновление пользовательских настроек (единицы веса, уведомления). Хранит
 * последний результат в сигнале-кэше `settings`, чтобы страницы могли
 * читать настройки без повторного вызова.
 */
import { Injectable, inject, signal } from '@angular/core';

import { Settings } from '../../shared/models';
import { SettingsUpdateParams } from '../../mock/settings/handlers';
import { MockApiClient } from '../../mock/mock-api-client';

/** Типы контракта Settings, потребляемые страницами. */
export type { SettingsUpdateParams };

@Injectable({ providedIn: 'root' })
export class SettingsService {
  private readonly client = inject(MockApiClient);

  private readonly settingsState = signal<Settings | null>(null);

  /** Кэш последних загруженных настроек; null — ещё не загружены. */
  readonly settings = this.settingsState.asReadonly();

  /** Настройки пользователя (или значения по умолчанию) → обновляет кэш. */
  async get(): Promise<Settings> {
    const settings = await this.client.call<Settings>('settings.get', null);
    this.settingsState.set(settings);
    return settings;
  }

  /** Частичное обновление настроек → обновлённые значения и обновление кэша. */
  async update(params: SettingsUpdateParams): Promise<Settings> {
    const settings = await this.client.call<Settings>('settings.update', params);
    this.settingsState.set(settings);
    return settings;
  }
}
