import {
  formatDateLabel,
  parseIsoDate,
  shiftIsoDate,
  toIsoDate,
  todayIso,
} from './dates';

describe('dates — даты без UTC-сдвига', () => {
  it('toIsoDate собирает строку из локальных компонентов', () => {
    expect(toIsoDate(new Date(2026, 0, 5))).toBe('2026-01-05');
    expect(toIsoDate(new Date(2026, 11, 31))).toBe('2026-12-31');
  });

  it('todayIso совпадает с toIsoDate(new Date())', () => {
    expect(todayIso()).toBe(toIsoDate(new Date()));
  });

  describe('parseIsoDate', () => {
    it('разбирает корректную дату в локальную полночь', () => {
      const date = parseIsoDate('2026-03-09');
      expect(date).not.toBeNull();
      expect(date!.getFullYear()).toBe(2026);
      expect(date!.getMonth()).toBe(2);
      expect(date!.getDate()).toBe(9);
    });

    it('не принимает неконтрактные строки', () => {
      expect(parseIsoDate('09.03.2026')).toBeNull();
      expect(parseIsoDate('2026-3-9')).toBeNull();
      expect(parseIsoDate('')).toBeNull();
    });

    it('отвергает невозможные даты (нормализация не проходит)', () => {
      expect(parseIsoDate('2026-02-30')).toBeNull();
      expect(parseIsoDate('2026-13-01')).toBeNull();
    });

    it('29 февраля високосного года валидно', () => {
      expect(parseIsoDate('2024-02-29')).not.toBeNull();
    });
  });

  describe('shiftIsoDate', () => {
    it('сдвигает через границы месяца и года', () => {
      expect(shiftIsoDate('2026-03-01', -1)).toBe('2026-02-28');
      expect(shiftIsoDate('2026-01-01', -1)).toBe('2025-12-31');
      expect(shiftIsoDate('2024-02-28', 1)).toBe('2024-02-29');
    });

    it('неконтрактную строку возвращает как есть', () => {
      expect(shiftIsoDate('не-дата', 1)).toBe('не-дата');
    });
  });

  describe('formatDateLabel', () => {
    it('сегодня — «Сегодня», вчера — «Вчера»', () => {
      expect(formatDateLabel(todayIso())).toBe('Сегодня');
      expect(formatDateLabel(shiftIsoDate(todayIso(), -1))).toBe('Вчера');
    });

    it('неконтрактную строку возвращает как есть', () => {
      expect(formatDateLabel('мусор')).toBe('мусор');
    });

    it('прочие даты — длинная локаль ru', () => {
      const label = formatDateLabel('2020-01-15');
      expect(label).toContain('январ');
      expect(label).not.toBe('Сегодня');
    });
  });
});
