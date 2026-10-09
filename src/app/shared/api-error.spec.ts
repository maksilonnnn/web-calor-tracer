import { isApiError, NON_HTTP_ERROR_STATUS, toApiError } from './api-error';
import { ApiError } from './models';

describe('api-error — работа с отказами мок-вызовов', () => {
  const apiError: ApiError = { status: 409, body: { message: 'Конфликт' } };

  describe('isApiError', () => {
    it('распознаёт форму ApiError', () => {
      expect(isApiError(apiError)).toBeTrue();
      expect(isApiError({ status: 400, body: { message: 'x', errors: { a: ['y'] } } })).toBeTrue();
    });

    it('отклоняет посторонние значения', () => {
      expect(isApiError(null)).toBeFalse();
      expect(isApiError('строка')).toBeFalse();
      expect(isApiError({})).toBeFalse();
      expect(isApiError({ status: '400', body: { message: 'x' } })).toBeFalse();
      expect(isApiError({ status: 400 })).toBeFalse();
    });
  });

  describe('toApiError', () => {
    it('пропускает ApiError без изменений', () => {
      expect(toApiError(apiError)).toBe(apiError);
    });

    it('оборачивает Error с сохранением message', () => {
      expect(toApiError(new Error('сбой'))).toEqual({
        status: NON_HTTP_ERROR_STATUS,
        body: { message: 'сбой' },
      });
    });

    it('постороннее значение превращает в fallback-сообщение', () => {
      expect(toApiError(42, 'Неизвестная ошибка')).toEqual({
        status: NON_HTTP_ERROR_STATUS,
        body: { message: 'Неизвестная ошибка' },
      });
    });
  });
});
