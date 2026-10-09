import {
  formatQuantity,
  quantityStep,
  toDisplayQuantity,
  toGrams,
  weightUnitLabel,
} from './units';

describe('units — единицы веса (история №5)', () => {
  it('weightUnitLabel: г и кг', () => {
    expect(weightUnitLabel('g')).toBe('г');
    expect(weightUnitLabel('kg')).toBe('кг');
  });

  it('toDisplayQuantity: граммы — как есть, килограммы — деление на 1000', () => {
    expect(toDisplayQuantity(150, 'g')).toBe(150);
    expect(toDisplayQuantity(150, 'kg')).toBe(0.15);
  });

  it('toGrams: килограммы — умножение на 1000', () => {
    expect(toGrams(150, 'g')).toBe(150);
    expect(toGrams(0.15, 'kg')).toBe(150);
  });

  it('formatQuantity: подпись единицы и округление', () => {
    expect(formatQuantity(150, 'g')).toBe('150 г');
    expect(formatQuantity(150, 'kg')).toBe('0.15 кг');
  });

  it('quantityStep: шаг для г и кг', () => {
    expect(quantityStep('g')).toBe(10);
    expect(quantityStep('kg')).toBe(0.1);
  });
});
