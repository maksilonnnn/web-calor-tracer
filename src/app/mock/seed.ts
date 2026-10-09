/**
 * Сид-фикстуры мок-БД: детерминированное начальное состояние ключа mockDb.
 *
 * Демо-пользователь, каталог продуктов и записи дневника за сегодня и два
 * предыдущих дня (даты считаются относительно текущей локальной даты через
 * shared/dates.ts — без UTC-сдвига), настройки по умолчанию. Все id
 * генерируются детерминированным uuid-генератором: повторный re-seed
 * (очистка/повреждение localStorage) воспроизводит то же состояние.
 *
 * Демо-учётка: email alex@example.com, пароль Demo1234! (см. README).
 */
import { MealType, MEAL_TYPES, Product, DEFAULT_SETTINGS } from '../shared/models';
import { shiftIsoDate, todayIso } from '../shared/dates';
import { createDeterministicUuidGenerator } from './ids';
import { MockDbData, MockDiaryRecord, MockUser } from './mock-db';

/** Seed детерминированного uuid-генератора. */
const SEED = 20260101;

/** Демо-учётка (единственный носитель пароля вместо бэкенда). */
const DEMO_NAME = 'Алексей';
const DEMO_EMAIL = 'alex@example.com';
const DEMO_PASSWORD = 'Demo1234!';

/** Каталог продуктов: питательная ценность указана на 100 г. */
const PRODUCT_CATALOG: ReadonlyArray<Omit<Product, 'id'>> = [
  { name: 'Куриная грудка', calories: 165, protein: 31, fat: 3.6, carbs: 0, category: 'Мясо' },
  { name: 'Рис белый', calories: 130, protein: 2.7, fat: 0.3, carbs: 28, category: 'Крупы' },
  { name: 'Яйцо куриное', calories: 155, protein: 13, fat: 11, carbs: 1.1, category: 'Яйца' },
  { name: 'Хлеб белый', calories: 265, protein: 9, fat: 3.2, carbs: 49, category: 'Выпечка' },
  { name: 'Молоко 2.5%', calories: 52, protein: 2.8, fat: 2.5, carbs: 4.7, category: 'Молочные' },
  { name: 'Яблоко', calories: 52, protein: 0.3, fat: 0.2, carbs: 14, category: 'Фрукты' },
  { name: 'Творог 5%', calories: 121, protein: 17, fat: 5, carbs: 1.8, category: 'Молочные' },
  { name: 'Гречка', calories: 132, protein: 4.2, fat: 1.6, carbs: 25, category: 'Крупы' },
];

/** Позиция плана дня: индекс продукта каталога + количество в граммах. */
interface SeedItem {
  product: number;
  quantity: number;
}

/** План одного дня: приём пищи → позиции. */
type SeedDay = Partial<Record<MealType, readonly SeedItem[]>>;

/** Записи дневника демо-пользователя: сегодня, вчера, позавчера. */
const SEED_DIARY: readonly SeedDay[] = [
  {
    breakfast: [
      { product: 2, quantity: 100 },
      { product: 3, quantity: 50 },
      { product: 4, quantity: 200 },
    ],
    lunch: [
      { product: 0, quantity: 150 },
      { product: 1, quantity: 100 },
    ],
    dinner: [
      { product: 6, quantity: 150 },
      { product: 5, quantity: 150 },
    ],
    snack: [{ product: 5, quantity: 100 }],
  },
  {
    breakfast: [
      { product: 7, quantity: 150 },
      { product: 4, quantity: 150 },
    ],
    lunch: [
      { product: 0, quantity: 180 },
      { product: 1, quantity: 150 },
    ],
    dinner: [{ product: 6, quantity: 120 }],
    snack: [{ product: 5, quantity: 120 }],
  },
  {
    breakfast: [
      { product: 2, quantity: 120 },
      { product: 3, quantity: 60 },
    ],
    lunch: [
      { product: 0, quantity: 150 },
      { product: 7, quantity: 150 },
    ],
    dinner: [
      { product: 1, quantity: 100 },
      { product: 6, quantity: 100 },
    ],
  },
];

/**
 * Строит полный сид мок-БД. Чистая функция без побочных эффектов: запись в
 * localStorage делает MockDb при инициализации ключа.
 */
export function seedFixtures(): MockDbData {
  const nextId = createDeterministicUuidGenerator(SEED);

  const user: MockUser = {
    id: nextId(),
    name: DEMO_NAME,
    email: DEMO_EMAIL,
    password: DEMO_PASSWORD,
  };

  const products: Product[] = PRODUCT_CATALOG.map((product) => ({ ...product, id: nextId() }));

  const today = todayIso();
  const diary: MockDiaryRecord[] = SEED_DIARY.map((day, offset) =>
    buildDiaryRecord(nextId, user.id, shiftIsoDate(today, -offset), products, day),
  );

  return {
    users: [user],
    diary,
    settings: [{ userId: user.id, ...DEFAULT_SETTINGS }],
  };
}

/** Собирает запись дневника: всегда четыре приёма пищи по MEAL_TYPES. */
function buildDiaryRecord(
  nextId: () => string,
  userId: string,
  date: string,
  products: readonly Product[],
  day: SeedDay,
): MockDiaryRecord {
  return {
    id: nextId(),
    userId,
    date,
    meals: MEAL_TYPES.map((type) => ({
      id: nextId(),
      type,
      items: (day[type] ?? []).map((seed) => ({
        id: nextId(),
        product: products[seed.product],
        quantity: seed.quantity,
      })),
    })),
  };
}
