import { calculateNutrition, sumNutrition } from './calculations';
import { MealItem, Product } from './models';

function product(overrides: Partial<Product> = {}): Product {
  return {
    id: 'p1',
    name: 'Куриная грудка',
    calories: 165,
    protein: 31,
    fat: 3.6,
    carbs: 0,
    ...overrides,
  };
}

describe('calculations — расчёт питательности', () => {
  describe('calculateNutrition', () => {
    it('пересчитывает значения на 100 г пропорционально количеству', () => {
      const result = calculateNutrition(product(), 150);
      expect(result).toEqual({ calories: 248, protein: 46.5, fat: 5.4, carbs: 0 });
    });

    it('калории — целое, макронутриенты — до десятых', () => {
      const result = calculateNutrition(
        product({ calories: 130, protein: 2.7, fat: 0.3, carbs: 28 }),
        100,
      );
      expect(result).toEqual({ calories: 130, protein: 2.7, fat: 0.3, carbs: 28 });
    });

    it('нулевое количество даёт нули', () => {
      expect(calculateNutrition(product(), 0)).toEqual({
        calories: 0,
        protein: 0,
        fat: 0,
        carbs: 0,
      });
    });
  });

  describe('sumNutrition', () => {
    it('суммирует позиции', () => {
      const items: MealItem[] = [
        { id: 'i1', product: product({ calories: 100, protein: 10, fat: 5, carbs: 20 }), quantity: 100 },
        { id: 'i2', product: product({ calories: 200, protein: 20, fat: 10, carbs: 40 }), quantity: 50 },
      ];
      expect(sumNutrition(items)).toEqual({
        calories: 200,
        protein: 20,
        fat: 10,
        carbs: 40,
      });
    });

    it('пустой список — все нули', () => {
      expect(sumNutrition([])).toEqual({ calories: 0, protein: 0, fat: 0, carbs: 0 });
    });
  });
});
