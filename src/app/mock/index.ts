/**
 * Агрегатор мок-слоя: единственная точка сборки — подключение сида и
 * регистрация обработчиков всех доменов (auth, diary, dashboard, settings,
 * profile). Вызывается один раз при бутстрапе через provideAppInitializer
 * (core/config/app.config.ts) до первого обращения страниц к сервисам core.
 *
 * Клиент — параметр: бутстрап вызывает без аргумента (инжекционный контекст
 * APP_INITIALIZER — берётся root-экземпляр MockApiClient, тот же, что у
 * сервисов core), тесты подставляют собственный экземпляр. Повторный вызов
 * идемпотентен: повторная регистрация заменяет обработчики.
 *
 * Наружу мок-слой импортируют только сервисы core (и app.config для сборки);
 * страницы и layout не импортируют обработчики напрямую.
 */
import { inject } from '@angular/core';

import { registerAuthHandlers } from './auth/handlers';
import { registerDashboardHandlers } from './dashboard/handlers';
import { registerDiaryHandlers } from './diary/handlers';
import { MockApiClient } from './mock-api-client';
import { configureMockDbSeed } from './mock-db';
import { registerProfileHandlers } from './profile/handlers';
import { seedFixtures } from './seed';
import { registerSettingsHandlers } from './settings/handlers';

/** Собирает мок-слой: сид + обработчики всех доменов. */
export function setupMockLayer(client?: MockApiClient): void {
  const target = client ?? inject(MockApiClient);
  configureMockDbSeed(seedFixtures);
  registerAuthHandlers(target);
  registerDiaryHandlers(target);
  registerDashboardHandlers(target);
  registerSettingsHandlers(target);
  registerProfileHandlers(target);
}
