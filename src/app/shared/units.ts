/**
 * Утилиты единиц веса (история №5): хранение и контракты сервисов всегда
 * в граммах, отображение и ввод — в выбранных пользователем единицах.
 * Чистые функции без состояния, используются страницами и модалкой.
 */
import { WeightUnit } from './models';

/** Граммов в килограмме. */
const GRAMS_PER_KILOGRAM = 1000;

/** Подпись единицы для интерфейса: «г» либо «кг». */
export function weightUnitLabel(unit: WeightUnit): string {
  return unit === 'kg' ? 'кг' : 'г';
}

/** Грамы → число в выбранной единице (150 г → 0.15 кг). */
export function toDisplayQuantity(grams: number, unit: WeightUnit): number {
  return unit === 'kg' ? grams / GRAMS_PER_KILOGRAM : grams;
}

/** Значение в выбранной единице → граммы (0.15 кг → 150). */
export function toGrams(value: number, unit: WeightUnit): number {
  return unit === 'kg' ? value * GRAMS_PER_KILOGRAM : value;
}

/** Округление отображаемого количества до разумной точности. */
function roundDisplay(value: number): number {
  return Math.round(value * 1000) / 1000;
}

/** Количество в граммах → строка для интерфейса («150 г», «0.15 кг»). */
export function formatQuantity(grams: number, unit: WeightUnit): string {
  return `${roundDisplay(toDisplayQuantity(grams, unit))} ${weightUnitLabel(unit)}`;
}

/** Шаг изменения количества для степпера в текущих единицах. */
export function quantityStep(unit: WeightUnit): number {
  return unit === 'kg' ? 0.1 : 10;
}
