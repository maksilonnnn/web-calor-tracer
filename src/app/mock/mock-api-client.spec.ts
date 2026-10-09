import { fakeAsync, tick } from '@angular/core/testing';

import { ApiError, MOCK_DELAY_MS, STORAGE_KEYS } from '../shared/models';
import { MockApiClient } from './mock-api-client';
import { MockDbData } from './mock-db';
import { MockErrorStatus, MockValidationError } from './mock-error';
import { newRuntimeId } from './ids';

function makeClient(): MockApiClient {
  return new MockApiClient();
}

function captureRejection(promise: Promise<unknown>): { error?: unknown } {
  const captured: { error?: unknown } = {};
  promise.catch((error: unknown) => {
    captured.error = error;
  });
  return captured;
}

function stored(): MockDbData {
  return JSON.parse(localStorage.getItem(STORAGE_KEYS.mockDb) ?? 'null') as MockDbData;
}

describe('MockApiClient — конвейер мок-вызова', () => {
  beforeEach(() => localStorage.clear());

  afterEach(() => localStorage.clear());

  describe('задержка вызова', () => {
    it('успешный вызов не завершён на 499 мс и завершён ровно на 500 мс', fakeAsync(() => {
      const client = makeClient();
      client.register('test.ok', () => ({ value: 42 }));

      const startedAt = Date.now();
      let settled = false;
      let duration = Number.NaN;
      client.call<{ value: number }>('test.ok', {}).then(() => {
        duration = Date.now() - startedAt;
        settled = true;
      });

      tick(499);
      expect(settled).withContext('не ранее 500 мс').toBeFalse();
      tick(1);
      expect(settled).toBeTrue();
      expect(duration).toBe(MOCK_DELAY_MS);
    }));

    it('отказ тоже задерживается: reject не ранее 500 мс', fakeAsync(() => {
      const client = makeClient();
      client.register('test.conflict', () => {
        throw new MockValidationError(409, 'Конфликт');
      });

      const captured = captureRejection(client.call('test.conflict', {}));
      tick(499);
      expect(captured.error).toBeUndefined();
      tick(1);
      expect(captured.error).toBeDefined();
    }));
  });

  describe('форма ApiError', () => {
    it('MockValidationError(400, message, errors) → ApiError {status, body}', fakeAsync(() => {
      const client = makeClient();
      client.register('test.bad-input', () => {
        throw new MockValidationError(400, 'Данные заполнены неверно', {
          name: ['Заполните поле'],
        });
      });

      const captured = captureRejection(client.call('test.bad-input', {}));
      tick(500);

      expect(captured.error).toEqual({
        status: 400,
        body: {
          message: 'Данные заполнены неверно',
          errors: { name: ['Заполните поле'] },
        },
      } satisfies ApiError);
    }));

    it('без errors тело содержит только message', fakeAsync(() => {
      const client = makeClient();
      client.register('test.plain', () => {
        throw new MockValidationError(409, 'Пользователь с таким email уже существует');
      });

      const captured = captureRejection(client.call('test.plain', {}));
      tick(500);

      const apiError = captured.error as ApiError;
      expect(apiError.status).toBe(409);
      expect(apiError.body.message).toBe('Пользователь с таким email уже существует');
      expect(Object.prototype.hasOwnProperty.call(apiError.body, 'errors')).toBeFalse();
    }));

    it('все статусы маппируются с сохранением message', fakeAsync(() => {
      const client = makeClient();
      const statuses: MockErrorStatus[] = [400, 401, 403, 404, 409, 429];
      const capturedByStatus = new Map<MockErrorStatus, { error?: unknown }>();
      for (const status of statuses) {
        client.register(`test.status-${status}`, () => {
          throw new MockValidationError(status, `Отказ ${status}`);
        });
        capturedByStatus.set(status, captureRejection(client.call(`test.status-${status}`, null)));
      }
      tick(500);

      for (const status of statuses) {
        const apiError = capturedByStatus.get(status)?.error as ApiError;
        expect(apiError.status).withContext(`статус ${status}`).toBe(status);
        expect(apiError.body.message).toBe(`Отказ ${status}`);
      }
    }));

    it('чужое исключение обработчика пробрасывается как есть', fakeAsync(() => {
      const client = makeClient();
      const boom = new Error('взрыв обработчика');
      client.register('test.bug', () => {
        throw boom;
      });

      const captured = captureRejection(client.call('test.bug', null));
      tick(500);
      expect(captured.error).toBe(boom);
    }));
  });

  describe('реестр обработчиков', () => {
    it('call возвращает значение обработчика; обработчик получает params целиком', fakeAsync(() => {
      const client = makeClient();
      const params = { date: '2026-01-01' };
      let seenParams: unknown = null;
      client.register('test.echo', (_db, p: unknown) => {
        seenParams = p;
        return { echoed: p };
      });

      let resolved: { echoed: unknown } | undefined;
      client.call<{ echoed: unknown }>('test.echo', params).then((r) => (resolved = r));
      tick(500);

      expect(seenParams).toBe(params);
      expect(resolved?.echoed).toBe(params);
    }));

    it('мутация через конвейер персистится в mockDb', fakeAsync(() => {
      const client = makeClient();
      client.register('users.create', (db, p: { email: string }) =>
        db.mutate((data) => {
          const user = {
            id: newRuntimeId(),
            name: 'Новый',
            email: p.email,
            password: 'Demo1234!',
          };
          data.users.push(user);
          return user;
        }),
      );

      let created: { email: string } | undefined;
      client.call<{ email: string }>('users.create', { email: 'new@example.com' }).then((u) => (created = u));
      tick(500);

      expect(created?.email).toBe('new@example.com');
      expect(stored().users).toEqual([created as never]);
    }));

    it('неизвестный метод — Error с именем метода, без ApiError', async () => {
      const client = makeClient();
      const error = await client.call('ghost.method', {}).then(
        () => undefined,
        (e: unknown) => e,
      );
      expect(error).toBeInstanceOf(Error);
      expect((error as Error).message).toContain('ghost.method');
      expect((error as ApiError).status).toBeUndefined();
      expect(localStorage.getItem(STORAGE_KEYS.mockDb)).toBeNull();
    });

    it('повторная register заменяет обработчик', fakeAsync(() => {
      const client = makeClient();
      client.register('test.replace', () => 'первый');
      client.register('test.replace', () => 'второй');

      let resolved: string | undefined;
      client.call<string>('test.replace', null).then((r) => (resolved = r));
      tick(500);
      expect(resolved).toBe('второй');
    }));
  });
});
