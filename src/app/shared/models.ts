/**
 * Общие модели DTO и константы приложения — единый словарь типов для
 * сервисов core и страниц (аналог эталонного приложения). Типы совпадают с
 * контрактами REST API (`/api/v1`).
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

/** Параметры auth.login. */
export interface LoginParams {
  email: string;
  password: string;
}

/** Параметры auth.register. */
export interface RegisterParams {
  name: string;
  email: string;
  password: string;
  confirmPassword: string;
}

/** Пищевая ценность нового продукта (на 100 г) — без id: его присваивает бэкенд. */
export interface FoodInput {
  name: string;
  calories: number;
  protein: number;
  fat: number;
  carbs: number;
  category?: string;
}

/** Параметры diary.addFood. */
export interface DiaryAddFoodParams {
  date: string;
  mealType: MealType;
  product: FoodInput;
  /** Количество в граммах. */
  quantity: number;
}

/** Параметры diary.updateItem: новое количество и данные продукта (на 100 г). */
export interface DiaryUpdateItemParams {
  /** Количество в граммах. */
  quantity: number;
  product: FoodInput;
}

/** Параметры settings.update: частичное обновление. */
export interface SettingsUpdateParams {
  weightUnit?: WeightUnit;
  notificationsEnabled?: boolean;
}

/** Параметры profile.update. */
export interface ProfileUpdateParams {
  name: string;
  email: string;
}

/** Параметры profile.changePassword. */
export interface ProfileChangePasswordParams {
  currentPassword: string;
  password: string;
  confirmPassword: string;
}

/** Страница выборки: { items, page, pageSize, totalCount, totalPages }. */
export interface PagedResult<T> {
  items: T[];
  page: number;
  pageSize: number;
  totalCount: number;
  totalPages: number;
}

/** Ошибка HTTP-вызова — транспортная форма отказа бэкенда. */
export interface ApiError {
  /** HTTP-код ответа: 400/401/404/409 (0 — сетевой сбой). */
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

/** Ключи хранилищ браузера: тема оформления. */
export const STORAGE_KEYS = {
  theme: 'calorie-tracker.theme',
} as const;
