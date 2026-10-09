/**
 * Утилиты дат: конвертация 'YYYY-MM-DD' ↔ Date ↔ читаемая подпись
 * без UTC-сдвига. Строка 'YYYY-MM-DD' — формат хранения/передачи;
 * Date собирается из local-компонентов (getFullYear/getMonth/getDate),
 * без toISOString: он переводит мгновение в UTC и в таймзоне UTC+N
 * ночью возвращает предыдущий день.
 */

/** Строгий вид контрактной строки даты: ровно 4-2-2 цифры через дефис. */
const ISO_DATE_PATTERN = /^(\d{4})-(\d{2})-(\d{2})$/;

/** Дополняет число нулями слева до нужной длины (7 → '07'). */
function pad(value: number, length: number): string {
  return String(value).padStart(length, '0');
}

/** Date → 'YYYY-MM-DD' из local-компонентов. */
export function toIsoDate(date: Date): string {
  return `${pad(date.getFullYear(), 4)}-${pad(date.getMonth() + 1, 2)}-${pad(date.getDate(), 2)}`;
}

/** Сегодняшняя дата в формате 'YYYY-MM-DD' по локальному времени. */
export function todayIso(): string {
  return toIsoDate(new Date());
}

/**
 * 'YYYY-MM-DD' → Date (локальная полночь) либо null для неконтрактной
 * строки и невозможных дат (Date молча нормализует переполнение, поэтому
 * валидна только дата, компоненты которой после сборки совпали с исходными).
 */
export function parseIsoDate(value: string): Date | null {
  const match = ISO_DATE_PATTERN.exec(value);
  if (match === null) {
    return null;
  }
  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);
  const date = new Date(0, 0, 1);
  date.setFullYear(year, month - 1, day);
  if (date.getFullYear() !== year || date.getMonth() !== month - 1 || date.getDate() !== day) {
    return null;
  }
  return date;
}

/** Сдвиг даты 'YYYY-MM-DD' на days дней (может быть отрицательным). */
export function shiftIsoDate(value: string, days: number): string {
  const date = parseIsoDate(value);
  if (date === null) {
    return value;
  }
  date.setDate(date.getDate() + days);
  return toIsoDate(date);
}

/**
 * Подпись даты для заголовка дневника: «Сегодня», «Вчера» либо
 * «д MMMM, EEEE» на русском. Неконтрактная строка возвращается как есть.
 */
export function formatDateLabel(value: string): string {
  const date = parseIsoDate(value);
  if (date === null) {
    return value;
  }
  const today = todayIso();
  if (value === today) {
    return 'Сегодня';
  }
  if (value === shiftIsoDate(today, -1)) {
    return 'Вчера';
  }
  return date.toLocaleDateString('ru-RU', {
    day: 'numeric',
    month: 'long',
    weekday: 'long',
  });
}
