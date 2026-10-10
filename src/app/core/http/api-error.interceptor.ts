/**
 * Функциональный интерцептор ошибок: приводит любой сбой HTTP к доменной
 * форме ApiError { status, body: { message, errors? } } — ровно то, что
 * уже ожидают страницы и catch-блоки сервисов.
 *
 * Разбор тела ответа:
 *  - `{ message, errors? }` от бэкенда — как есть;
 *  - иначе — текст-заглушка по коду (сетевой сбой, пустой ответ).
 *
 * Отдельно обрабатывается 401 на защищённых запросах (кроме `/auth/*`):
 * сбрасывается кэш текущего пользователя и выполняется переход на `/login`.
 * Для `/auth/me` редирект не делается — этим управляет AuthService.loadMe().
 */
import { HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { catchError, throwError } from 'rxjs';

import { toApiError } from '../../shared/api-error';
import { ApiError } from '../../shared/models';
import { AuthService } from '../services/auth.service';

/** Верхняя граница: сбои, не относящиеся к HTTP-ответу бэкенда. */
const NETWORK_ERROR_STATUS = 0;

/** Тело ошибки — структурный тип ответа бэкенда. */
function isErrorPayload(value: unknown): value is { message: string; errors?: unknown } {
  return (
    typeof value === 'object' &&
    value !== null &&
    typeof (value as { message?: unknown }).message === 'string'
  );
}

/** Извлекает тело { message, errors? } из ответа или задаёт заглушку. */
function extractBody(response: HttpErrorResponse): ApiError['body'] {
  const payload = response.error;
  if (isErrorPayload(payload)) {
    const body: ApiError['body'] = { message: payload.message };
    if (typeof payload.errors === 'object' && payload.errors !== null) {
      body.errors = payload.errors as Record<string, string[]>;
    }
    return body;
  }
  if (typeof payload === 'string' && payload.trim() !== '') {
    return { message: payload };
  }
  if (response.status === NETWORK_ERROR_STATUS) {
    return { message: 'Нет соединения с сервером' };
  }
  return { message: 'Неизвестная ошибка' };
}

/** Транспортный сбой → ApiError (прочие значения делегируются toApiError). */
function toApiErrorFromResponse(error: unknown): ApiError {
  if (error instanceof HttpErrorResponse) {
    return { status: error.status, body: extractBody(error) };
  }
  return toApiError(error);
}

/** Запросы домена Auth: их 401 — ожидаемый ответ, а не истечение сессии. */
function isAuthRequest(url: string): boolean {
  return /(^|\/)auth\//.test(url);
}

export const apiErrorInterceptor: HttpInterceptorFn = (request, next) => {
  const router = inject(Router);
  const auth = inject(AuthService);

  return next(request).pipe(
    catchError((error: unknown) => {
      const apiError = toApiErrorFromResponse(error);
      if (apiError.status === 401 && !isAuthRequest(request.url)) {
        auth.clearSession();
        void router.navigate(['/login']);
      }
      return throwError(() => apiError);
    }),
  );
};
