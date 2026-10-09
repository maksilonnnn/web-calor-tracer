/**
 * Сигнал отказа мок-обработчика: доменные обработчики сообщают об отказе
 * выбросом MockValidationError с HTTP-кодом и телом; MockApiClient
 * транслирует исключение в транспортную форму ApiError {status, body:
 * {message, errors?}} и reject'ит промис вызова. Прочие исключения — дефекты
 * кода, клиент пробрасывает их наружу как есть.
 */

/** Эмулируемые HTTP-коды отказов. */
export type MockErrorStatus = 400 | 401 | 403 | 404 | 409 | 429;

/** Ошибка мок-обработчика: статус + сообщение + ошибки по полям. */
export class MockValidationError extends Error {
  /** Ошибки по полям — обязательны только для 400 «Данные заполнены неверно». */
  readonly errors?: Record<string, string[]>;

  constructor(
    readonly status: MockErrorStatus,
    message: string,
    errors?: Record<string, string[]>,
  ) {
    super(message);
    this.name = 'MockValidationError';
    this.errors = errors;
  }
}

/**
 * Тексты отказов «бэкенда», не привязанные к одному домену. Текст
 * «Данные заполнены неверно» живёт в ERROR_TEXTS (INVALID_FORM_MESSAGE) —
 * там же, где тексты полей.
 */
export const MOCK_MESSAGES = {
  /** Нет/битая сессия у метода авторизованного домена. */
  unauthorized: 'Не авторизован',
  /** Дубликат email при регистрации/смене профиля. */
  emailTaken: 'Пользователь с таким email уже существует',
  /** Единый отказ входа — не раскрывает, существует ли аккаунт. */
  wrongCredentials: 'Неверный email или пароль',
  /** Неверный текущий пароль при смене из настроек. */
  wrongCurrentPassword: 'Неверный текущий пароль',
  /** Запись не найдена (обновление/удаление несуществующей позиции). */
  notFound: 'Запись не найдена',
} as const;
