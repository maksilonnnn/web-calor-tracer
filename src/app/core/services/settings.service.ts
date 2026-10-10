/**
 * SettingsService — сервис домена Settings для страниц: чтение и частичное
 * обновление пользовательских настроек (единицы веса, уведомлений). Хранит
 * последний результат в сигнале-кэше `settings`, чтобы страницы могли
 * читать настройки без повторного вызова.
 */
import { HttpClient } from '@angular/common/http';
import { Injectable, inject, signal } from '@angular/core';
import { Observable, tap } from 'rxjs';

import { Settings, SettingsUpdateParams } from '../../shared/models';

/** Типы контракта Settings, потребляемые страницами. */
export type { SettingsUpdateParams };

@Injectable({ providedIn: 'root' })
export class SettingsService {
  private readonly http = inject(HttpClient);

  private readonly settingsState = signal<Settings | null>(null);

  /** Кэш последних загруженных настроек; null — ещё не загружены. */
  readonly settings = this.settingsState.asReadonly();

  /** Настройки пользователя (или значения по умолчанию) → обновляет кэш. */
  get(): Observable<Settings> {
    return this.http
      .get<Settings>('settings')
      .pipe(tap((settings) => this.settingsState.set(settings)));
  }

  /** Частичное обновление настроек → обновлённые значения и обновление кэша. */
  update(params: SettingsUpdateParams): Observable<Settings> {
    return this.http
      .put<Settings>('settings', params)
      .pipe(tap((settings) => this.settingsState.set(settings)));
  }
}
