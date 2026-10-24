import { DEFAULT_SETTINGS, MEAL_TYPES, STORAGE_KEYS } from '../shared/models';
import { shiftIsoDate, todayIso } from '../shared/dates';
import { MOCK_ID_PATTERN } from './ids';
import { MockDb, MockDbData, configureMockDbSeed, resetMockDbSeed } from './mock-db';
import { seedFixtures } from './seed';

/** Сгенерированные «свои» id сущностей (без ссылок и повторов). */
function entityIds(seed: MockDbData): string[] {
  const ids = [
    ...seed.users.map((user) => user.id),
    ...seed.diary.map((record) => record.id),
  ];
  for (const record of seed.diary) {
    for (const meal of record.meals) {
      ids.push(meal.id);
      for (const item of meal.items) {
        ids.push(item.id);
      }
    }
  }
  return ids;
}

/** Ссылки на каталог продуктов (по одному на позицию, могут повторяться). */
function productIds(seed: MockDbData): string[] {
  return seed.diary.flatMap((record) =>
    record.meals.flatMap((meal) => meal.items.map((item) => item.product.id)),
  );
}

describe('seedFixtures — сид мок-БД', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  afterEach(() => {
    resetMockDbSeed();
    localStorage.clear();
  });

  it('детерминизм: два независимых построения совпадают байт в байт', () => {
    expect(JSON.stringify(seedFixtures())).toBe(JSON.stringify(seedFixtures()));
  });

  it('сгенерированные id сущностей уникальны, id продуктов — по формату', () => {
    const seed = seedFixtures();
    const entities = entityIds(seed);
    expect(entities.length).toBeGreaterThan(0);
    for (const id of entities) {
      expect(id).toMatch(MOCK_ID_PATTERN);
    }
    expect(new Set(entities).size).toBe(entities.length);

    for (const id of new Set(productIds(seed))) {
      expect(id).toMatch(MOCK_ID_PATTERN);
    }
  });

  it('демо-пользователь один: Алексей, alex@example.com, пароль Demo1234!', () => {
    const seed = seedFixtures();
    expect(seed.users.length).toBe(1);
    const user = seed.users[0];
    expect(user.name).toBe('Алексей');
    expect(user.email).toBe('alex@example.com');
    expect(user.password).toBe('Demo1234!');
  });

  it('дневник: сегодня, вчера и позавчера; четыре приёма пищи по порядку в каждой записи', () => {
    const seed = seedFixtures();
    const today = todayIso();
    expect(seed.diary.map((record) => record.date)).toEqual([
      today,
      shiftIsoDate(today, -1),
      shiftIsoDate(today, -2),
    ]);
    for (const record of seed.diary) {
      expect(record.meals.map((meal) => meal.type)).toEqual([...MEAL_TYPES]);
    }
  });

  it('позиции ссылаются на каталог продуктов с ненулевыми названиями и питательностью', () => {
    const seed = seedFixtures();
    const items = seed.diary.flatMap((record) =>
      record.meals.flatMap((meal) => meal.items),
    );
    expect(items.length).toBeGreaterThan(0);
    for (const item of items) {
      expect(item.product.name.length).toBeGreaterThan(0);
      expect(item.quantity).toBeGreaterThan(0);
      expect(item.product.calories).toBeGreaterThan(0);
    }
  });

  it('настройки демо-пользователя — значения по умолчанию', () => {
    const seed = seedFixtures();
    expect(seed.settings.length).toBe(1);
    expect(seed.settings[0].userId).toBe(seed.users[0].id);
    const { userId: _userId, ...settings } = seed.settings[0];
    expect(settings).toEqual(DEFAULT_SETTINGS);
  });

  it('re-seed через MockDb воспроизводит тот же ключ', () => {
    configureMockDbSeed(seedFixtures);
    const first = new MockDb();
    first.read();
    const jsonFirst = localStorage.getItem(STORAGE_KEYS.mockDb);
    expect(jsonFirst).toBe(JSON.stringify(seedFixtures()));

    localStorage.clear();
    const second = new MockDb();
    second.read();
    expect(localStorage.getItem(STORAGE_KEYS.mockDb)).toBe(jsonFirst);
  });

  it('сид проходит структурную проверку MockDb без защитного re-seed', () => {
    localStorage.setItem(STORAGE_KEYS.mockDb, JSON.stringify(seedFixtures()));
    const warnSpy = spyOn(console, 'warn');
    expect(new MockDb().read()).toEqual(seedFixtures());
    expect(warnSpy).not.toHaveBeenCalled();
  });
});
