import { createDeterministicUuidGenerator, MOCK_ID_PATTERN, newRuntimeId } from './ids';

describe('Идентификаторы мок-БД', () => {
  describe('MOCK_ID_PATTERN — строгий uuid 8-4-4-4-12', () => {
    it('принимает корректный uuid в нижнем и верхнем регистре', () => {
      expect('0b0b0b0b-0b0b-4b0b-8b0b-0b0b0b0b0b0b').toMatch(MOCK_ID_PATTERN);
      expect('0B0B0B0B-0B0B-4B0B-8B0B-0B0B0B0B0B0B').toMatch(MOCK_ID_PATTERN);
    });

    it('отвергает повреждённые формы и не-uuid строки', () => {
      expect('product-chicken').not.toMatch(MOCK_ID_PATTERN);
      expect('').not.toMatch(MOCK_ID_PATTERN);
      expect('0b0b0b0b-0b0b-4b0b-8b0b-0b0b0b0b0b0').not.toMatch(MOCK_ID_PATTERN);
      expect('0b0b0b0b-0b0b-4b0b-8b0b-0b0b0b0b0b0b0').not.toMatch(MOCK_ID_PATTERN);
      expect('gb0b0b0b-0b0b-4b0b-8b0b-0b0b0b0b0b0b').not.toMatch(MOCK_ID_PATTERN);
    });
  });

  describe('createDeterministicUuidGenerator — сид', () => {
    it('повторяемость: один seed — идентичные последовательности', () => {
      const first = createDeterministicUuidGenerator(20260101);
      const second = createDeterministicUuidGenerator(20260101);
      for (let i = 0; i < 50; i++) {
        expect(first()).toBe(second());
      }
    });

    it('разные seed — разные последовательности', () => {
      const first = createDeterministicUuidGenerator(1);
      const second = createDeterministicUuidGenerator(2);
      const fromFirst = Array.from({ length: 50 }, () => first());
      const fromSecond = Array.from({ length: 50 }, () => second());
      expect(fromFirst).not.toEqual(fromSecond);
    });

    it('уникальность: 200 значений подряд без повторов', () => {
      const generate = createDeterministicUuidGenerator(777);
      const values = new Set(Array.from({ length: 200 }, () => generate()));
      expect(values.size).toBe(200);
    });

    it('формат: uuid с версией 4 и вариантом RFC 4122', () => {
      const generate = createDeterministicUuidGenerator(31337);
      for (let i = 0; i < 50; i++) {
        const value = generate();
        expect(value).toMatch(MOCK_ID_PATTERN);
        expect(value[14]).toBe('4');
        expect('89ab').toContain(value[19]);
      }
    });
  });

  describe('newRuntimeId — записи runtime', () => {
    it('возвращает uuid с битами version/variant и без повторов', () => {
      const values = new Set(Array.from({ length: 100 }, () => newRuntimeId()));
      expect(values.size).toBe(100);
      for (const value of values) {
        expect(value).toMatch(MOCK_ID_PATTERN);
        expect(value[14]).toBe('4');
        expect('89ab').toContain(value[19]);
      }
    });
  });
});
