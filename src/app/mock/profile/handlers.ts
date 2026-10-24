/**
 * Мок-обработчики домена Profile: просмотр и редактирование профиля
 * (имя/email), смена пароля и удаление аккаунта. Все методы доступны
 * пользователю сессии; без сессии или с битой — 401.
 *
 * Валидация полей — теми же правилами и словарём, что и клиентские формы
 * (shared/validation): клиент и «бэкенд» проверяют одинаково. Пароли не
 * триммятся и сравниваются дословно. Удаление аккаунта убирает пользователя
 * вместе с его дневником и настройками и очищает сессию.
 */
import { UserDto } from '../../shared/models';
import { ERROR_TEXTS, INVALID_FORM_MESSAGE } from '../../shared/validation/error-texts';
import {
  emailFormat,
  name as nameRule,
  passwordRules,
  requiredTrim,
  validateValue,
} from '../../shared/validation/validators';
import { MockApiClient } from '../mock-api-client';
import { MockDb, MockDbData, MockUser } from '../mock-db';
import { MOCK_MESSAGES, MockValidationError } from '../mock-error';
import { SessionStore } from '../auth/session-store';

/** Параметры profile.update. */
export interface ProfileUpdateParams {
  name: string;
  email: string;
}

/** Параметры profile.changePassword. */
export interface ProfileChangePasswordParams {
  currentPassword: string;
  password: string;
  confirmPassword: string;
}

/** Строковый параметр как есть (защита от мусора в payload). */
function asText(value: unknown): string {
  return typeof value === 'string' ? value : '';
}

/** Публичный DTO пользователя (без пароля). */
function toUserDto(user: MockUser): UserDto {
  return { id: user.id, name: user.name, email: user.email };
}

/** Пользователь сессии; без сессии или с битой — 401 «Не авторизован». */
function requireUser(session: SessionStore, data: MockDbData): MockUser {
  const userId = session.getUserId();
  const user = userId !== null ? data.users.find((candidate) => candidate.id === userId) : undefined;
  if (user === undefined) {
    throw new MockValidationError(401, MOCK_MESSAGES.unauthorized);
  }
  return user;
}

/** profile.get: профиль пользователя сессии. */
export function handleProfileGet(db: MockDb, session: SessionStore): UserDto {
  const data = db.read();
  return toUserDto(requireUser(session, data));
}

/**
 * profile.update: валидация имени/email (те же правила, что у формы) → 400
 * с errors; занятый email → 409; иначе обновление и возврат UserDto.
 */
export function handleProfileUpdate(
  db: MockDb,
  session: SessionStore,
  params: ProfileUpdateParams,
): UserDto {
  const data = db.read();
  const user = requireUser(session, data);

  const raw = (params ?? {}) as Partial<ProfileUpdateParams>;
  const name = asText(raw.name);
  const email = asText(raw.email);

  const errors: Record<string, string[]> = {};
  const nameTexts = validateValue(name, [requiredTrim(), nameRule()]);
  if (nameTexts.length > 0) {
    errors['name'] = nameTexts;
  }
  const emailTexts = validateValue(email, [requiredTrim(), emailFormat()]);
  if (emailTexts.length > 0) {
    errors['email'] = emailTexts;
  }
  if (Object.keys(errors).length > 0) {
    throw new MockValidationError(400, INVALID_FORM_MESSAGE, errors);
  }

  const trimmedName = name.trim();
  const trimmedEmail = email.trim();
  const emailTaken = data.users.some(
    (other) => other.id !== user.id && other.email.toLowerCase() === trimmedEmail.toLowerCase(),
  );
  if (emailTaken) {
    throw new MockValidationError(409, MOCK_MESSAGES.emailTaken);
  }

  return db.mutate((draft) => {
    const target = draft.users.find((candidate) => candidate.id === user.id);
    if (target === undefined) {
      throw new MockValidationError(401, MOCK_MESSAGES.unauthorized);
    }
    target.name = trimmedName;
    target.email = trimmedEmail;
    return toUserDto(target);
  });
}

/**
 * profile.changePassword: неверный текущий пароль → 400 «Неверный текущий
 * пароль» (до полевых ошибок нового пароля); иначе проверка нового пароля
 * и его повтора теми же правилами, что у формы, и сохранение.
 */
export function handleProfileChangePassword(
  db: MockDb,
  session: SessionStore,
  params: ProfileChangePasswordParams,
): null {
  const data = db.read();
  const user = requireUser(session, data);

  const raw = (params ?? {}) as Partial<ProfileChangePasswordParams>;
  const currentPassword = asText(raw.currentPassword);
  if (currentPassword !== user.password) {
    throw new MockValidationError(400, MOCK_MESSAGES.wrongCurrentPassword);
  }

  const password = asText(raw.password);
  const confirmPassword = asText(raw.confirmPassword);
  const errors: Record<string, string[]> = {};
  const passwordTexts = validateValue(password, [requiredTrim(), passwordRules()]);
  if (passwordTexts.length > 0) {
    errors['password'] = passwordTexts;
  }
  const confirmTexts = validateValue(confirmPassword, [requiredTrim()]);
  if (confirmPassword !== '' && confirmPassword !== password) {
    confirmTexts.push(ERROR_TEXTS['password.mismatch']);
  }
  if (confirmTexts.length > 0) {
    errors['confirmPassword'] = confirmTexts;
  }
  if (Object.keys(errors).length > 0) {
    throw new MockValidationError(400, INVALID_FORM_MESSAGE, errors);
  }

  db.mutate((draft) => {
    const target = draft.users.find((candidate) => candidate.id === user.id);
    if (target === undefined) {
      throw new MockValidationError(401, MOCK_MESSAGES.unauthorized);
    }
    target.password = password;
  });
  return null;
}

/**
 * profile.deleteAccount: удаление пользователя вместе с его дневником и
 * настройками, очистка сессии. Возврата данных нет.
 */
export function handleProfileDeleteAccount(db: MockDb, session: SessionStore): null {
  const data = db.read();
  const user = requireUser(session, data);

  db.mutate((draft) => {
    draft.users = draft.users.filter((candidate) => candidate.id !== user.id);
    draft.diary = draft.diary.filter((record) => record.userId !== user.id);
    draft.settings = draft.settings.filter((record) => record.userId !== user.id);
  });
  session.clear();
  return null;
}

/** Регистрирует обработчики profile.* в реестре клиента. */
export function registerProfileHandlers(client: MockApiClient): void {
  const session = new SessionStore();
  client.register('profile.get', (db: MockDb) => handleProfileGet(db, session));
  client.register('profile.update', (db: MockDb, params: ProfileUpdateParams) =>
    handleProfileUpdate(db, session, params),
  );
  client.register('profile.changePassword', (db: MockDb, params: ProfileChangePasswordParams) =>
    handleProfileChangePassword(db, session, params),
  );
  client.register('profile.deleteAccount', (db: MockDb) => handleProfileDeleteAccount(db, session));
}
