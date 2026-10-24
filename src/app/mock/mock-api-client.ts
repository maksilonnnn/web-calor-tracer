/**
 * MockApiClient — конвейер мок-вызова: реестр обработчиков + задержка
 * MOCK_DELAY_MS + трансляция MockValidationError → ApiError.
 *
 * call<T>(method, params) находит обработчик в таблице, выполняет его
 * синхронно над собственным экземпляром MockDb и откладывает завершение
 * (resolve и reject) до момента «не ранее MOCK_DELAY_MS от начала вызова».
 * Обработчики — чистые функции над MockDb, доступа к клиенту не имеют;
 * наружу мок-слой импортируют только сервисы core, которые и вызывают call.
 */
import { Injectable } from '@angular/core';

import { ApiError, MOCK_DELAY_MS } from '../shared/models';
import { MockDb } from './mock-db';
import { MockValidationError } from './mock-error';

/** Имя мок-метода — строка из реестра (конвенция: домен и операция). */
export type MockMethodId = string;

/** Обработчик мок-метода: чистая синхронная функция над MockDb. */
export type MockHandler<P = unknown, R = unknown> = (db: MockDb, params: P) => R;

type RegisteredHandler = MockHandler<unknown, unknown>;

/** Задержка до MOCK_DELAY_MS от начала вызова (уже учтённое время — минус). */
function remainingDelayMs(startedAt: number): number {
  return Math.max(0, MOCK_DELAY_MS - (Date.now() - startedAt));
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/** Трансляция сигнала отказа в транспортную форму ApiError. */
function toApiError(error: MockValidationError): ApiError {
  const body: ApiError['body'] = error.errors
    ? { message: error.message, errors: error.errors }
    : { message: error.message };
  return { status: error.status, body };
}

@Injectable({ providedIn: 'root' })
export class MockApiClient {
  private readonly handlers = new Map<MockMethodId, RegisteredHandler>();
  private readonly db = new MockDb();

  /** Регистрирует обработчик метода; повторная регистрация заменяет. */
  register<P, R>(method: MockMethodId, handler: MockHandler<P, R>): this {
    this.handlers.set(method, handler as unknown as RegisteredHandler);
    return this;
  }

  /**
   * Мок-вызов: задержка ~MOCK_DELAY_MS; успех — тело по контракту метода;
   * отказ — ApiError {status, body: {message, errors?}}. Не зарегистрированный
   * метод — ошибка сборки мок-слоя (обычный Error без задержки); прочие
   * исключения обработчиков пробрасываются как есть (дефекты кода).
   */
  async call<T>(method: MockMethodId, params: unknown): Promise<T> {
    const handler = this.handlers.get(method);
    if (handler === undefined) {
      throw new Error(`MockApiClient: обработчик метода «${method}» не зарегистрирован`);
    }
    const startedAt = Date.now();
    try {
      const result = handler(this.db, params) as T;
      await sleep(remainingDelayMs(startedAt));
      return result;
    } catch (error) {
      await sleep(remainingDelayMs(startedAt));
      throw error instanceof MockValidationError ? toApiError(error) : error;
    }
  }
}
