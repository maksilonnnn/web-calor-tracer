/**
 * Мок-обработчики домена Dashboard: агрегат дня по данным дневника той же
 * мок-БД. Итоги и разбивку считает мок (calculateNutrition/sumNutrition),
 * а не страница: добавил продукт в модалке → он сразу виден и в дневнике,
 * и в итогах дашборда. Нормы берутся из настроек пользователя, при их
 * отсутствии — настройки по умолчанию.
 *
 * Доступны только пользователю сессии; без сессии или с битой — 401.
 */
import {
  DashboardData,
  DashboardGoals,
  MealType,
  MEAL_TYPES,
  Product,
  Settings,
  DEFAULT_SETTINGS,
} from '../../shared/models';
import { calculateNutrition, sumNutrition } from '../../shared/calculations';
import { MockApiClient } from '../mock-api-client';
import { MockDb, MockDbData, MockDiaryRecord } from '../mock-db';
import { MOCK_MESSAGES, MockValidationError } from '../mock-error';
import { SessionStore } from '../auth/session-store';

/** Сколько недавних продуктов показывать (уникальные по названию). */
const RECENT_PRODUCTS_LIMIT = 4;

/** Строковый параметр как есть (защита от мусора в payload). */
function asText(value: unknown): string {
  return typeof value === 'string' ? value : '';
}

/** Пользователь сессии; без сессии или с битой — 401 «Не авторизован». */
function requireUserId(session: SessionStore, data: MockDbData): string {
  const userId = session.getUserId();
  if (userId === null || !data.users.some((user) => user.id === userId)) {
    throw new MockValidationError(401, MOCK_MESSAGES.unauthorized);
  }
  return userId;
}

/** Запись дня пользователя либо undefined. */
function findRecord(
  data: MockDbData,
  userId: string,
  date: string,
): MockDiaryRecord | undefined {
  return data.diary.find((record) => record.userId === userId && record.date === date);
}

/** Настройки пользователя либо настройки по умолчанию. */
function settingsFor(data: MockDbData, userId: string): Settings {
  const record = data.settings.find((candidate) => candidate.userId === userId);
  if (record === undefined) {
    return { ...DEFAULT_SETTINGS };
  }
  const { userId: _userId, ...settings } = record;
  return settings;
}

/** Дневные нормы для дашборда из настроек. */
function toGoals(settings: Settings): DashboardGoals {
  return {
    calories: settings.dailyCalories,
    protein: settings.dailyProtein,
    fat: settings.dailyFat,
    carbs: settings.dailyCarbs,
  };
}

/**
 * Недавние продукты: уникальные по названию продукты дневника пользователя,
 * записи — по убыванию даты, не более RECENT_PRODUCTS_LIMIT штук.
 */
function recentProducts(data: MockDbData, userId: string): Product[] {
  const records = data.diary
    .filter((record) => record.userId === userId)
    .slice()
    .sort((a, b) => (a.date < b.date ? 1 : a.date > b.date ? -1 : 0));

  const seen = new Set<string>();
  const products: Product[] = [];
  for (const record of records) {
    for (const meal of record.meals) {
      for (const item of meal.items) {
        if (seen.has(item.product.name)) {
          continue;
        }
        seen.add(item.product.name);
        products.push(item.product);
        if (products.length >= RECENT_PRODUCTS_LIMIT) {
          return products;
        }
      }
    }
  }
  return products;
}

/** Агрегат дня: пустой день, если записи за дату ещё нет. */
function toDashboard(data: MockDbData, userId: string, date: string): DashboardData {
  const record = findRecord(data, userId, date);
  const allItems = record === undefined ? [] : record.meals.flatMap((meal) => meal.items);
  const totals = sumNutrition(allItems);

  const meals = MEAL_TYPES.map((type) => {
    const meal = record?.meals.find((candidate) => candidate.type === type);
    const items = meal?.items ?? [];
    const calories = items.reduce(
      (sum, item) => sum + calculateNutrition(item.product, item.quantity).calories,
      0,
    );
    return { type: type as MealType, calories, itemsCount: items.length };
  });

  return {
    date,
    totalCalories: totals.calories,
    totalProtein: totals.protein,
    totalFat: totals.fat,
    totalCarbs: totals.carbs,
    meals,
    recentProducts: recentProducts(data, userId),
    goals: toGoals(settingsFor(data, userId)),
  };
}

/** dashboard.getDay: агрегат дня пользователя сессии. */
export function handleDashboardGetDay(
  db: MockDb,
  session: SessionStore,
  params: { date: string },
): DashboardData {
  const data = db.read();
  const userId = requireUserId(session, data);
  return toDashboard(data, userId, asText(params?.date));
}

/** Регистрирует обработчики dashboard.* в реестре клиента. */
export function registerDashboardHandlers(client: MockApiClient): void {
  const session = new SessionStore();
  client.register('dashboard.getDay', (db: MockDb, params: { date: string }) =>
    handleDashboardGetDay(db, session, params),
  );
}
