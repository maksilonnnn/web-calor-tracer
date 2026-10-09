import { Product, MealItem } from './models';

export function calculateNutrition(
  product: Product,
  quantity: number
): { calories: number; protein: number; fat: number; carbs: number } {
  const multiplier = quantity / 100;
  return {
    calories: Math.round(product.calories * multiplier),
    protein: Math.round(product.protein * multiplier * 10) / 10,
    fat: Math.round(product.fat * multiplier * 10) / 10,
    carbs: Math.round(product.carbs * multiplier * 10) / 10,
  };
}

export function sumNutrition(items: MealItem[]): {
  calories: number;
  protein: number;
  fat: number;
  carbs: number;
} {
  return items.reduce(
    (acc, item) => {
      const nutrition = calculateNutrition(item.product, item.quantity);
      return {
        calories: acc.calories + nutrition.calories,
        protein: acc.protein + nutrition.protein,
        fat: acc.fat + nutrition.fat,
        carbs: acc.carbs + nutrition.carbs,
      };
    },
    { calories: 0, protein: 0, fat: 0, carbs: 0 }
  );
}
