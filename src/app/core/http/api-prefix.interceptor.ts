/**
 * Функциональный интерцептор исходящих запросов:
 *  - добавляет базовый префикс API (`API_BASE_URL`, по умолчанию `/api/v1`);
 *  - включает отправку cookie (`withCredentials`) — JWT хранится в
 *    httpOnly-cookie `access_token` и не доступен из JavaScript;
 *  - не трогает абсолютные URL и уже префиксованные пути.
 *
 * Единственное место, где задаётся версия API и режим передачи учётных данных.
 */
import { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';

import { API_BASE_URL } from '../config/api-base-url';

/** Абсолютный URL (http/https) — префикс не добавляется. */
function isAbsolute(url: string): boolean {
  return /^https?:\/\//i.test(url);
}

/** Приводит относительный путь к виду `${base}/${path}` без двойных слэшей. */
function toApiUrl(baseUrl: string, url: string): string {
  const base = baseUrl.replace(/\/+$/, '');
  const path = url.replace(/^\/+/, '');
  return `${base}/${path}`;
}

export const apiPrefixInterceptor: HttpInterceptorFn = (request, next) => {
  if (isAbsolute(request.url)) {
    return next(request);
  }

  const baseUrl = inject(API_BASE_URL);
  const apiRequest = request.clone({
    url: toApiUrl(baseUrl, request.url),
    withCredentials: true,
  });
  return next(apiRequest);
};
