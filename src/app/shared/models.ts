/**
 * Общие модели DTO и константы приложения — единый словарь типов для
 * сервисов core, мок-слоя и страниц (аналог эталонного приложения).
 *
 * Идентификаторы всех сущностей — строки (uuid). Даты хранятся и
 * передаются строкой 'YYYY-MM-DD' (локальная дата, без UTC-сдвига);
 * конвертация — только через shared/dates.ts. Количество продуктов
 * хранится и передаётся в граммах — единица хранения всегда граммы,
 * отображение зависит от настроек (shared/units.ts).
 */

/** Продукт: питательная ценность указана на 100 г. */
export interface Product {
  id: string;
  name: string;
  /** ккал на 100 г. */
  calories: number;
  /** белки на 100 г. */
  protein: number;
  /** жиры на 100 г. */
  fat: number;
  /** углеводы на 100 г. */
  carbs: number;
  category?: string;
}

/** Приём пищи. */
export type MealType = 'breakfast' | 'lunch' | 'dinner' | 'snack';

/** Позиция приёма пищи: продукт и его количество в граммах. */
export interface MealItem {
  id: string;
  product: Product;
  /** Количество в граммах. */
  quantity: number;
}

/** Приём пищи с позициями. */
export interface Meal {
  id: string;
  type: MealType;
  items: MealItem[];
}

/** Дневник питания за дату: всегда четыре приёма пищи. */
export interface DiaryEntry {
  id: string;
  /** Дата 'YYYY-MM-DD'. */
  date: string;
  meals: Meal[];
}

/** Единица отображения веса. */
export type WeightUnit = 'g' | 'kg';

/** Настройки пользователя. */
export interface Settings {
  dailyCalories: number;
  dailyProtein: number;
  dailyFat: number;
  dailyCarbs: number;
  weightUnit: WeightUnit;
  notificationsEnabled: boolean;
}

/**
 * Настройки по умолчанию: используются сидом демо-пользователя и как
 * значения новых пользователей, у которых ещё нет сохранённых настроек.
 */
export const DEFAULT_SETTINGS: Settings = {
  dailyCalories: 2500,
  dailyProtein: 150,
  dailyFat: 83,
  dailyCarbs: 300,
  weightUnit: 'g',
  notificationsEnabled: true,
};

/** Дневные нормы для отображения на дашборде. */
export interface DashboardGoals {
  calories: number;
  protein: number;
  fat: number;
  carbs: number;
}

/** Агрегат дня для дашборда: итоги, разбивка по приёмам, продукты, нормы. */
export interface DashboardData {
  date: string;
  totalCalories: number;
  totalProtein: number;
  totalFat: number;
  totalCarbs: number;
  meals: { type: MealType; calories: number; itemsCount: number }[];
  recentProducts: Product[];
  goals: DashboardGoals;
}

/** Текущий пользователь — ответ auth.register/auth.login/auth.me (без пароля). */
export interface UserDto {
  id: string;
  name: string;
  email: string;
}

/** Ошибка мок-вызова — эмуляция HTTP-ответа с телом ошибки. */
export interface ApiError {
  /** Эмулируемый HTTP-код: 400/401/404/409. */
  status: number;
  body: {
    /** Текст ошибки; показывается пользователю дословно. */
    message: string;
    /** Ошибки по полям — только для 400 «Данные заполнены неверно». */
    errors?: Record<string, string[]>;
  };
}

/** Порядок приёмов пищи в дневнике и на дашборде. */
export const MEAL_TYPES: readonly MealType[] = ['breakfast', 'lunch', 'dinner', 'snack'];

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

/** Ключи хранилищ браузера: данные мока, сессия и тема оформления. */
export const STORAGE_KEYS = {
  mockDb: 'calorie-tracker.mock.db.v1',
  session: 'calorie-tracker.session.userId',
  theme: 'calorie-tracker.theme',
} as const;

/** Задержка мок-вызовов в миллисекундах — имитация бэкенда. */
export const MOCK_DELAY_MS = 500;
