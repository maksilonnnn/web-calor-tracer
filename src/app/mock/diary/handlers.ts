/**
 * Мок-обработчики домена Diary: чтение дня, добавление продукта, изменение
 * количества и удаление позиции. Данные — по пользователю сессии.
 *
 * Все данные дня считает мок: getDay всегда возвращает четыре приёма пищи
 * (пустые, если записей нет); addFood создаёт запись дня при необходимости.
 * Валидация — теми же правилами и словарём, что и клиентская форма
 * добавления еды.
 */
import { MealItem, MealType, MEAL_TYPES, Product } from '../../shared/models';
import { INVALID_FORM_MESSAGE } from '../../shared/validation/error-texts';
import {
  nonNegativeNumber,
  positiveNumber,
  productName,
  requiredTrim,
  validateValue,
} from '../../shared/validation/validators';
import { newRuntimeId } from '../ids';
import { MockApiClient } from '../mock-api-client';
import { MockDb, MockDbData, MockDiaryRecord } from '../mock-db';
import { MOCK_MESSAGES, MockValidationError } from '../mock-error';
import { SessionStore } from '../auth/session-store';

/** Пищевая ценность нового продукта (на 100 г) — без id: его присваивает мок. */
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

/** Параметры diary.updateQuantity. */
export interface DiaryUpdateQuantityParams {
  itemId: string;
  /** Новое количество в граммах. */
  quantity: number;
}

/** Параметры diary.removeItem. */
export interface DiaryRemoveItemParams {
  itemId: string;
}

/** Строковый параметр как есть (защита от мусора в payload). */
function asText(value: unknown): string {
  return typeof value === 'string' ? value : '';
}

/** Числовой параметр; отсутствие/мусор → NaN (его отвергнут валидаторы). */
function asNumber(value: unknown): number {
  return typeof value === 'number' ? value : NaN;
}

/** Пользователь сессии; без сессии или с битой — 401 «Не авторизован». */
function requireUserId(session: SessionStore, data: MockDbData): string {
  const userId = session.getUserId();
  if (userId === null || !data.users.some((user) => user.id === userId)) {
    throw new MockValidationError(401, MOCK_MESSAGES.unauthorized);
  }
  return userId;
}

/** Пустой день: четыре приёма пищи без позиций. */
function emptyDiaryRecord(userId: string, date: string): MockDiaryRecord {
  return {
    id: newRuntimeId(),
    userId,
    date,
    meals: MEAL_TYPES.map((type) => ({ id: newRuntimeId(), type, items: [] })),
  };
}

/** Публичный DTO дня — без служебного userId. */
function toDiaryEntry(record: MockDiaryRecord) {
  const { userId: _userId, ...entry } = record;
  return entry;
}

/** Запись дня пользователя либо undefined. */
function findRecord(
  data: MockDbData,
  userId: string,
  date: string,
): MockDiaryRecord | undefined {
  return data.diary.find((record) => record.userId === userId && record.date === date);
}

/** Запись, содержащая позицию itemId, либо undefined. */
function findRecordByItem(
  data: MockDbData,
  userId: string,
  itemId: string,
): MockDiaryRecord | undefined {
  return data.diary.find(
    (record) =>
      record.userId === userId &&
      record.meals.some((meal) => meal.items.some((item) => item.id === itemId)),
  );
}

/** Тексты ошибок полей формы добавления еды; пусто — ошибок нет. */
function addFoodFieldErrors(
  food: FoodInput,
  quantity: number,
): Record<string, string[]> {
  const errors: Record<string, string[]> = {};
  const add = (field: string, texts: string[]): void => {
    if (texts.length > 0) {
      errors[field] = texts;
    }
  };
  add('name', validateValue(food.name, [requiredTrim(), productName()]));
  add('quantity', validateValue(quantity, [requiredTrim(), positiveNumber()]));
  add('calories', validateValue(food.calories, [nonNegativeNumber()]));
  add('protein', validateValue(food.protein, [nonNegativeNumber()]));
  add('fat', validateValue(food.fat, [nonNegativeNumber()]));
  add('carbs', validateValue(food.carbs, [nonNegativeNumber()]));
  return errors;
}

export function handleDiaryGetDay(
  db: MockDb,
  session: SessionStore,
  params: { date: string },
): ReturnType<typeof toDiaryEntry> {
  const data = db.read();
  const userId = requireUserId(session, data);
  const date = asText(params?.date);
  const record = findRecord(data, userId, date);
  return toDiaryEntry(record ?? emptyDiaryRecord(userId, date));
}

export function handleDiaryAddFood(
  db: MockDb,
  session: SessionStore,
  params: DiaryAddFoodParams,
): ReturnType<typeof toDiaryEntry> {
  const raw = (params ?? {}) as Partial<DiaryAddFoodParams>;
  const date = asText(raw.date);
  const mealType = (raw.mealType ?? 'breakfast') as MealType;
  const quantity = asNumber(raw.quantity);
  const product = (raw.product ?? ({} as FoodInput)) as FoodInput;

  const data = db.read();
  const userId = requireUserId(session, data);

  const errors = addFoodFieldErrors(product, quantity);
  if (Object.keys(errors).length > 0) {
    throw new MockValidationError(400, INVALID_FORM_MESSAGE, errors);
  }

  return db.mutate((draft) => {
    let record = findRecord(draft, userId, date);
    if (record === undefined) {
      record = emptyDiaryRecord(userId, date);
      draft.diary.push(record);
    }
    const meal = record.meals.find((candidate) => candidate.type === mealType);
    if (meal === undefined) {
      throw new MockValidationError(400, INVALID_FORM_MESSAGE, {
        mealType: ['Неизвестный приём пищи'],
      });
    }
    const item: MealItem = {
      id: newRuntimeId(),
      product: {
        id: newRuntimeId(),
        name: asText(product.name).trim(),
        calories: product.calories,
        protein: product.protein,
        fat: product.fat,
        carbs: product.carbs,
        category: product.category,
      } satisfies Product,
      quantity,
    };
    meal.items.push(item);
    return toDiaryEntry(record);
  });
}

export function handleDiaryUpdateQuantity(
  db: MockDb,
  session: SessionStore,
  params: DiaryUpdateQuantityParams,
): ReturnType<typeof toDiaryEntry> {
  const raw = (params ?? {}) as Partial<DiaryUpdateQuantityParams>;
  const itemId = asText(raw.itemId);
  const quantity = asNumber(raw.quantity);

  const data = db.read();
  const userId = requireUserId(session, data);

  const quantityTexts = validateValue(quantity, [requiredTrim(), positiveNumber()]);
  if (quantityTexts.length > 0) {
    throw new MockValidationError(400, INVALID_FORM_MESSAGE, { quantity: quantityTexts });
  }
  if (findRecordByItem(data, userId, itemId) === undefined) {
    throw new MockValidationError(404, MOCK_MESSAGES.notFound);
  }

  return db.mutate((draft) => {
    const record = findRecordByItem(draft, userId, itemId);
    if (record === undefined) {
      throw new MockValidationError(404, MOCK_MESSAGES.notFound);
    }
    for (const meal of record.meals) {
      const item = meal.items.find((candidate) => candidate.id === itemId);
      if (item !== undefined) {
        item.quantity = quantity;
      }
    }
    return toDiaryEntry(record);
  });
}

export function handleDiaryRemoveItem(
  db: MockDb,
  session: SessionStore,
  params: DiaryRemoveItemParams,
): ReturnType<typeof toDiaryEntry> {
  const raw = (params ?? {}) as Partial<DiaryRemoveItemParams>;
  const itemId = asText(raw.itemId);

  const data = db.read();
  const userId = requireUserId(session, data);
  if (findRecordByItem(data, userId, itemId) === undefined) {
    throw new MockValidationError(404, MOCK_MESSAGES.notFound);
  }

  return db.mutate((draft) => {
    const record = findRecordByItem(draft, userId, itemId);
    if (record === undefined) {
      throw new MockValidationError(404, MOCK_MESSAGES.notFound);
    }
    for (const meal of record.meals) {
      meal.items = meal.items.filter((item) => item.id !== itemId);
    }
    return toDiaryEntry(record);
  });
}

/** Регистрирует обработчики diary.* в реестре клиента. */
export function registerDiaryHandlers(client: MockApiClient): void {
  const session = new SessionStore();
  client.register('diary.getDay', (db: MockDb, params: { date: string }) =>
    handleDiaryGetDay(db, session, params),
  );
  client.register('diary.addFood', (db: MockDb, params: DiaryAddFoodParams) =>
    handleDiaryAddFood(db, session, params),
  );
  client.register('diary.updateQuantity', (db: MockDb, params: DiaryUpdateQuantityParams) =>
    handleDiaryUpdateQuantity(db, session, params),
  );
  client.register('diary.removeItem', (db: MockDb, params: DiaryRemoveItemParams) =>
    handleDiaryRemoveItem(db, session, params),
  );
}
