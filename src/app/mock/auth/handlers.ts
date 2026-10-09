/**
 * Мок-обработчики домена Auth: регистрация, вход, выход, текущий пользователь.
 *
 * Обработчики — чистые синхронные функции над MockDb; отказ сообщается
 * выбросом MockValidationError, MockApiClient транслирует его в ApiError.
 * Тексты ошибок полей строятся по правилам shared/validation/validators.ts
 * со словарём ERROR_TEXTS; тексты отказов «бэкенда» — из MOCK_MESSAGES.
 * Сессия — ключ STORAGE_KEYS.session через SessionStore.
 */
import { ERROR_TEXTS, INVALID_FORM_MESSAGE } from '../../shared/validation/error-texts';
import {
  emailFormat,
  name as nameRule,
  passwordRules,
  requiredTrim,
  validateValue,
} from '../../shared/validation/validators';
import { UserDto } from '../../shared/models';
import { newRuntimeId } from '../ids';
import { MockApiClient } from '../mock-api-client';
import { MockDb, MockUser } from '../mock-db';
import { MOCK_MESSAGES, MockValidationError } from '../mock-error';
import { SessionStore } from './session-store';

/** Параметры auth.register. */
export interface RegisterParams {
  name: string;
  email: string;
  password: string;
  confirmPassword: string;
}

/** Параметры auth.login. */
export interface LoginParams {
  email: string;
  password: string;
}

/** Ответ auth.register/login/me — пользователь без пароля. */
export type { UserDto as MeDto };

/** Строковый параметр вызова: не-строка (мусор в payload) → пустая строка. */
function asText(value: unknown): string {
  return typeof value === 'string' ? value : '';
}

/** Публичный DTO пользователя (без пароля). */
function toUserDto(user: MockUser): UserDto {
  return { id: user.id, name: user.name, email: user.email };
}

/**
 * auth.register: валидация полей (те же правила, что у формы) → 400 с
 * errors; дубликат email → 409; создание пользователя → сессия → UserDto.
 * Дневник и настройки новому пользователю создаются лениво при обращении.
 */
export function handleAuthRegister(
  db: MockDb,
  session: SessionStore,
  params: RegisterParams,
): UserDto {
  const raw = (params ?? {}) as Partial<RegisterParams>;
  const name = asText(raw.name);
  const email = asText(raw.email);
  const password = asText(raw.password);
  const confirmPassword = asText(raw.confirmPassword);

  const errors: Record<string, string[]> = {};
  const add = (field: string, texts: string[]): void => {
    if (texts.length > 0) {
      errors[field] = texts;
    }
  };
  add('name', validateValue(name, [requiredTrim(), nameRule()]));
  add('email', validateValue(email, [requiredTrim(), emailFormat()]));
  add('password', validateValue(password, [requiredTrim(), passwordRules()]));
  const confirmTexts = validateValue(confirmPassword, [requiredTrim()]);
  if (confirmPassword !== '' && confirmPassword !== password) {
    confirmTexts.push(ERROR_TEXTS['password.mismatch']);
  }
  add('confirmPassword', confirmTexts);
  if (Object.keys(errors).length > 0) {
    throw new MockValidationError(400, INVALID_FORM_MESSAGE, errors);
  }

  const trimmedName = name.trim();
  const trimmedEmail = email.trim();
  if (db.read().users.some((user) => user.email.toLowerCase() === trimmedEmail.toLowerCase())) {
    throw new MockValidationError(409, MOCK_MESSAGES.emailTaken);
  }

  const created = db.mutate((data) => {
    const user: MockUser = {
      id: newRuntimeId(),
      name: trimmedName,
      email: trimmedEmail,
      password,
    };
    data.users.push(user);
    return user;
  });
  session.setUserId(created.id);
  return toUserDto(created);
}

/**
 * auth.login: неверный email или пароль — единый 401 «Неверный email или
 * пароль» (не раскрывает существование аккаунта); успех ставит сессию.
 */
export function handleAuthLogin(
  db: MockDb,
  session: SessionStore,
  params: LoginParams,
): UserDto {
  const raw = (params ?? {}) as Partial<LoginParams>;
  const email = asText(raw.email).trim().toLowerCase();
  const password = asText(raw.password);

  const user = db.read().users.find((candidate) => candidate.email.toLowerCase() === email);
  if (user === undefined || user.password !== password) {
    throw new MockValidationError(401, MOCK_MESSAGES.wrongCredentials);
  }
  session.setUserId(user.id);
  return toUserDto(user);
}

/** auth.logout: сессия очищается; без сессии — тоже успех. */
export function handleAuthLogout(session: SessionStore): null {
  session.clear();
  return null;
}

/**
 * auth.me: UserDto по сессии; без сессии или с битой (пользователь удалён)
 * — сессия очищается и отказ 401 «Не авторизован».
 */
export function handleAuthMe(db: MockDb, session: SessionStore): UserDto {
  const userId = session.getUserId();
  const user = userId !== null ? db.read().users.find((u) => u.id === userId) : undefined;
  if (user === undefined) {
    session.clear();
    throw new MockValidationError(401, MOCK_MESSAGES.unauthorized);
  }
  return toUserDto(user);
}

/** Регистрирует обработчики auth.* в реестре клиента. */
export function registerAuthHandlers(client: MockApiClient): void {
  const session = new SessionStore();
  client.register('auth.register', (db: MockDb, params: RegisterParams) =>
    handleAuthRegister(db, session, params),
  );
  client.register('auth.login', (db: MockDb, params: LoginParams) =>
    handleAuthLogin(db, session, params),
  );
  client.register('auth.logout', () => handleAuthLogout(session));
  client.register('auth.me', (db: MockDb) => handleAuthMe(db, session));
}
