/**
 * Мок-БД: единый JSON-объект в localStorage по ключу STORAGE_KEYS.mockDb —
 * {users, diary, settings}. Сессия здесь НЕ хранится (отдельный ключ
 * STORAGE_KEYS.session, владелец — домен Auth).
 *
 * Правила:
 *  - чтение при первом обращении (ленивая инициализация в памяти);
 *  - отсутствие ключа → инициализация сидом;
 *  - запись JSON.stringify после каждой мутации (через mutate);
 *  - ошибка парсинга/структуры → защитный re-seed с предупреждением в консоль
 *    (без персональных данных), единственная точка console.warn мок-слоя;
 *  - read() возвращает изолированный клон (обработчики — чистые функции),
 *    всё, что должно сохраниться, делается через mutate;
 *  - mutate() транзакционен: функция работает над черновиком, при успехе
 *    черновик становится новым состоянием и сериализуется, при выбросе —
 *    черновик отбрасывается целиком.
 */
import { DiaryEntry, Product, Settings, STORAGE_KEYS, UserDto } from '../shared/models';

/** Пользователь мок-БД: DTO без пароля + пароль (демо-режим). */
export interface MockUser extends UserDto {
  password: string;
}

/** Запись дневника мок-БД: DiaryEntry с владельцем. */
export interface MockDiaryRecord extends DiaryEntry {
  userId: string;
}

/** Настройки мок-БД: Settings с владельцем. */
export interface MockSettingsRecord extends Settings {
  userId: string;
}

/** Полное состояние мок-БД — содержимое ключа mockDb. */
export interface MockDbData {
  users: MockUser[];
  diary: MockDiaryRecord[];
  settings: MockSettingsRecord[];
}

/** Поставщик сида: возвращает исходное состояние мок-БД. */
export type MockDbSeedProvider = () => MockDbData;

/** Пустое состояние — сид по умолчанию до подключения seedFixtures. */
export function emptyMockDbData(): MockDbData {
  return { users: [], diary: [], settings: [] };
}

let seedProvider: MockDbSeedProvider = emptyMockDbData;

/**
 * Подключает поставщика сида: вызывается один раз при сборке мок-слоя до
 * первого обращения к мок-БД. Дальнейшие инициализации ключа (отсутствие,
 * повреждение, очистка localStorage) берут данные от нового поставщика.
 */
export function configureMockDbSeed(seed: MockDbSeedProvider): void {
  seedProvider = seed;
}

/** Возвращает сид по умолчанию (пустое состояние) — для изоляции тестов. */
export function resetMockDbSeed(): void {
  seedProvider = emptyMockDbData;
}

/** Проверка структуры распарсенного значения перед гидратацией. */
function isMockDbData(value: unknown): value is MockDbData {
  if (typeof value !== 'object' || value === null) {
    return false;
  }
  const candidate = value as Record<string, unknown>;
  return (
    isRecordArray(candidate['users']) &&
    isRecordArray(candidate['diary']) &&
    isRecordArray(candidate['settings'])
  );
}

function isRecordArray(value: unknown): boolean {
  return Array.isArray(value) && value.every((item) => typeof item === 'object' && item !== null);
}

/**
 * Хранилище мок-БД: ленивая инициализация из localStorage, персистентность
 * после каждой мутации, защитный re-seed повреждённых данных.
 */
export class MockDb {
  private inMemory: MockDbData | null = null;

  /** Снимок состояния для чтения — клон; мутации только через mutate. */
  read(): MockDbData {
    return structuredClone(this.load());
  }

  /** Транзакционная мутация с сериализацией. */
  mutate<T>(mutation: (data: MockDbData) => T): T {
    const draft = structuredClone(this.load());
    const result = mutation(draft);
    this.inMemory = draft;
    localStorage.setItem(STORAGE_KEYS.mockDb, JSON.stringify(draft));
    return result;
  }

  /** Сбрасывает кэш в памяти: следующее обращение перечитает localStorage. */
  reset(): void {
    this.inMemory = null;
  }

  /** Ленивая инициализация: память → localStorage → сид (с записью ключа). */
  private load(): MockDbData {
    if (this.inMemory !== null) {
      return this.inMemory;
    }
    const raw = localStorage.getItem(STORAGE_KEYS.mockDb);
    if (raw !== null) {
      try {
        const parsed: unknown = JSON.parse(raw);
        if (isMockDbData(parsed)) {
          this.inMemory = parsed;
          return this.inMemory;
        }
        throw new Error('неожиданная структура');
      } catch {
        console.warn(
          `[mock-db] Ключ ${STORAGE_KEYS.mockDb} повреждён и не читается — данные восстановлены из сида.`,
        );
      }
    }
    this.inMemory = seedProvider();
    localStorage.setItem(STORAGE_KEYS.mockDb, JSON.stringify(this.inMemory));
    return this.inMemory;
  }
}

/** Продукт мок-БД (переэкспорт для удобства обработчиков/сида). */
export type { Product, Settings };
