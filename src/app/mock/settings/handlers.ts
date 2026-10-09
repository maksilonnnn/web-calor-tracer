/**
 * Мок-обработчики домена Settings (история №5): чтение и обновление
 * пользовательских настроек (единицы веса, уведомления). Настройки —
 * по пользователю сессии; если записи ещё нет, get() отдаёт настройки по
 * умолчанию, а update() создаёт запись лениво. Обновление частичное:
 * переданные поля накладываются на текущие значения.
 *
 * Доступны только пользователю сессии; без сессии или с битой — 401.
 */
import { Settings, WeightUnit, DEFAULT_SETTINGS } from '../../shared/models';
import { INVALID_FORM_MESSAGE } from '../../shared/validation/error-texts';
import { MockApiClient } from '../mock-api-client';
import { MockDb, MockDbData, MockSettingsRecord } from '../mock-db';
import { MOCK_MESSAGES, MockValidationError } from '../mock-error';
import { SessionStore } from '../auth/session-store';

/** Параметры settings.update: частичное обновление. */
export interface SettingsUpdateParams {
  weightUnit?: WeightUnit;
  notificationsEnabled?: boolean;
}

/** Текст ошибки недопустимого значения настройки (защита от мусора в payload). */
const INVALID_SETTINGS_VALUE = 'Некорректное значение';

/** Пользователь сессии; без сессии или с битой — 401 «Не авторизован». */
function requireUserId(session: SessionStore, data: MockDbData): string {
  const userId = session.getUserId();
  if (userId === null || !data.users.some((user) => user.id === userId)) {
    throw new MockValidationError(401, MOCK_MESSAGES.unauthorized);
  }
  return userId;
}

/** Публичный DTO настроек — без служебного userId. */
function toSettings(record: MockSettingsRecord): Settings {
  const { userId: _userId, ...settings } = record;
  return settings;
}

/** Настройки пользователя либо настройки по умолчанию. */
function settingsFor(data: MockDbData, userId: string): Settings {
  const record = data.settings.find((candidate) => candidate.userId === userId);
  return record === undefined ? { ...DEFAULT_SETTINGS } : toSettings(record);
}

/** settings.get: настройки пользователя сессии (или значения по умолчанию). */
export function handleSettingsGet(db: MockDb, session: SessionStore): Settings {
  const data = db.read();
  const userId = requireUserId(session, data);
  return settingsFor(data, userId);
}

/** settings.update: частичное обновление и возврат актуальных настроек. */
export function handleSettingsUpdate(
  db: MockDb,
  session: SessionStore,
  params: SettingsUpdateParams,
): Settings {
  const data = db.read();
  const userId = requireUserId(session, data);

  const raw = (params ?? {}) as Partial<SettingsUpdateParams>;
  const errors: Record<string, string[]> = {};
  if (raw.weightUnit !== undefined && raw.weightUnit !== 'g' && raw.weightUnit !== 'kg') {
    errors['weightUnit'] = [INVALID_SETTINGS_VALUE];
  }
  if (raw.notificationsEnabled !== undefined && typeof raw.notificationsEnabled !== 'boolean') {
    errors['notificationsEnabled'] = [INVALID_SETTINGS_VALUE];
  }
  if (Object.keys(errors).length > 0) {
    throw new MockValidationError(400, INVALID_FORM_MESSAGE, errors);
  }

  const current = settingsFor(data, userId);
  const next: Settings = {
    ...current,
    ...(raw.weightUnit !== undefined ? { weightUnit: raw.weightUnit } : {}),
    ...(raw.notificationsEnabled !== undefined
      ? { notificationsEnabled: raw.notificationsEnabled }
      : {}),
  };

  return db.mutate((draft) => {
    const existing = draft.settings.find((candidate) => candidate.userId === userId);
    if (existing === undefined) {
      const created: MockSettingsRecord = { userId, ...next };
      draft.settings.push(created);
      return toSettings(created);
    }
    existing.weightUnit = next.weightUnit;
    existing.notificationsEnabled = next.notificationsEnabled;
    existing.dailyCalories = next.dailyCalories;
    existing.dailyProtein = next.dailyProtein;
    existing.dailyFat = next.dailyFat;
    existing.dailyCarbs = next.dailyCarbs;
    return toSettings(existing);
  });
}

/** Регистрирует обработчики settings.* в реестре клиента. */
export function registerSettingsHandlers(client: MockApiClient): void {
  const session = new SessionStore();
  client.register('settings.get', (db: MockDb) => handleSettingsGet(db, session));
  client.register('settings.update', (db: MockDb, params: SettingsUpdateParams) =>
    handleSettingsUpdate(db, session, params),
  );
}
