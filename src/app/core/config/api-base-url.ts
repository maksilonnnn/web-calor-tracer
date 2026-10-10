/**
 * База REST API приложения — единственная точка, где задан префикс `/api/v1`.
 * Сервисы core вызывают относительные пути (`auth/me`, `diary`), а
 * функциональный интерцептор apiPrefixInterceptor добавляет этот префикс
 * к каждому исходящему запросу. Так версия API меняется в одном месте.
 */
import { InjectionToken } from '@angular/core';

/** Префикс всех запросов к бэкенду (без завершающего слэша). */
export const API_BASE_URL = new InjectionToken<string>('API_BASE_URL', {
  providedIn: 'root',
  factory: () => '/api/v1',
});
