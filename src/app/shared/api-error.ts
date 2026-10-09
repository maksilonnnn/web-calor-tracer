/**
 * Утилиты работы с отказами мок-вызовов: проверка «это транспортная форма
 * ошибки?» и приведение произвольного отказа к ApiError. Потребители —
 * сервисы core и страницы: catch-блоки вокруг client.call единообразно
 * различают эмулируемый HTTP-отказ и прочие исключения (дефекты кода).
 */
import { ApiError } from './models';

/** Ошибка формы ApiError: числовой статус + тело {message, errors?}. */
export function isApiError(value: unknown): value is ApiError {
  if (typeof value !== 'object' || value === null) {
    return false;
  }
  const candidate = value as Partial<ApiError>;
  return (
    typeof candidate.status === 'number' &&
    Number.isFinite(candidate.status) &&
    typeof candidate.body === 'object' &&
    candidate.body !== null &&
    typeof candidate.body.message === 'string' &&
    (candidate.body.errors === undefined || typeof candidate.body.errors === 'object')
  );
}

/** Статус для отказа, не являющегося ответом «бэкенда». */
export const NON_HTTP_ERROR_STATUS = 0;

/** Приводит произвольный отказ к ApiError. */
export function toApiError(value: unknown, fallbackMessage = 'Неизвестная ошибка'): ApiError {
  if (isApiError(value)) {
    return value;
  }
  if (value instanceof Error) {
    return { status: NON_HTTP_ERROR_STATUS, body: { message: value.message } };
  }
  return { status: NON_HTTP_ERROR_STATUS, body: { message: fallbackMessage } };
}
