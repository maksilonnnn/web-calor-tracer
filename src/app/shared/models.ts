export interface Product {
  id: string;
  name: string;
  calories: number;
  protein: number;
  fat: number;
  carbs: number;
  category?: string;
}

export type MealType = 'breakfast' | 'lunch' | 'dinner' | 'snack';

export interface MealItem {
  id: string;
  product: Product;
  quantity: number;
}

export interface Meal {
  id: string;
  type: MealType;
  items: MealItem[];
}

export interface DiaryEntry {
  id: string;
  date: string;
  meals: Meal[];
}

export interface Settings {
  dailyCalories: number;
  dailyProtein: number;
  dailyFat: number;
  dailyCarbs: number;
  weightUnit: 'g' | 'kg';
  notificationsEnabled: boolean;
}

export interface DashboardData {
  date: string;
  totalCalories: number;
  totalProtein: number;
  totalFat: number;
  totalCarbs: number;
  meals: {
    type: MealType;
    calories: number;
    itemsCount: number;
  }[];
  recentProducts: Product[];
}

export const MEAL_TYPE_LABELS: Record<MealType, string> = {
  breakfast: 'Завтрак',
  lunch: 'Обед',
  dinner: 'Ужин',
  snack: 'Перекус',
};

export const MEAL_TYPE_ICONS: Record<MealType, string> = {
  breakfast: '🌅',
  lunch: '☀️',
  dinner: '🌙',
  snack: '🍎',
};
