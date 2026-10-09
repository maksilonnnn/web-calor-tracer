import { DEFAULT_SETTINGS, MEAL_TYPES, STORAGE_KEYS } from '../shared/models';
import {
  MockDb,
  MockDbData,
  MockDiaryRecord,
  MockSettingsRecord,
  MockUser,
  configureMockDbSeed,
  emptyMockDbData,
  resetMockDbSeed,
} from './mock-db';

const DB_KEY = STORAGE_KEYS.mockDb;

function makeUser(login: string): MockUser {
  return {
    id: '0b0b0b0b-0b0b-4b0b-8b0b-0b0b0b0b0b0b',
    name: `Пользователь ${login}`,
    email: `${login}@example.com`,
    password: 'Demo1234!',
  };
}

function makeDiary(userId: string, date: string): MockDiaryRecord {
  return {
    id: '11111111-2222-4333-8444-555555555555',
    userId,
    date,
    meals: MEAL_TYPES.map((type) => ({ id: `${date}-${type}`, type, items: [] })),
  };
}

function makeSettings(userId: string): MockSettingsRecord {
  return { userId, ...DEFAULT_SETTINGS };
}

function stored(): MockDbData {
  return JSON.parse(localStorage.getItem(DB_KEY) ?? 'null') as MockDbData;
}

describe('MockDb — хранилище mockDb', () => {
  beforeEach(() => {
    localStorage.clear();
    resetMockDbSeed();
  });

  afterEach(() => {
    localStorage.clear();
    resetMockDbSeed();
  });

  describe('ленивая инициализация', () => {
    it('конструктор не пишет в localStorage; первое чтение инициализирует ключ', () => {
      const db = new MockDb();
      expect(localStorage.getItem(DB_KEY)).toBeNull();
      expect(db.read()).toEqual(emptyMockDbData());
      expect(localStorage.getItem(DB_KEY)).toBe(JSON.stringify(emptyMockDbData()));
    });

    it('второе чтение не перечитывает localStorage до reset', () => {
      const db = new MockDb();
      expect(db.read().users).toEqual([]);
      localStorage.setItem(DB_KEY, JSON.stringify({ ...emptyMockDbData(), users: [makeUser('hack')] }));
      expect(db.read().users).toEqual([]);
      db.reset();
      expect(db.read().users.length).toBe(1);
    });
  });

  describe('инициализация сидом', () => {
    it('отсутствие ключа → пустой сид по умолчанию', () => {
      const db = new MockDb();
      expect(db.read()).toEqual(emptyMockDbData());
      expect(stored()).toEqual(emptyMockDbData());
    });

    it('configureMockDbSeed задаёт данные инициализации', () => {
      const seed: MockDbData = { ...emptyMockDbData(), users: [makeUser('alex')] };
      configureMockDbSeed(() => structuredClone(seed));
      const db = new MockDb();
      expect(db.read().users).toEqual([makeUser('alex')]);
      expect(stored().users[0].email).toBe('alex@example.com');
    });

    it('сид вызывается ровно один раз на жизненный цикл кэша', () => {
      let calls = 0;
      configureMockDbSeed(() => {
        calls++;
        return emptyMockDbData();
      });
      const db = new MockDb();
      db.read();
      db.read();
      db.mutate((data) => data.users.push(makeUser('alex')));
      expect(calls).toBe(1);
    });
  });

  describe('защитный re-seed повреждённых данных', () => {
    it('битый JSON → предупреждение и откат к сиду с перезаписью ключа', () => {
      spyOn(console, 'warn');
      localStorage.setItem(DB_KEY, '{это не json');
      const db = new MockDb();
      expect(db.read()).toEqual(emptyMockDbData());
      expect(console.warn).toHaveBeenCalledTimes(1);
      expect(String((console.warn as jasmine.Spy).calls.argsFor(0)[0])).toContain(DB_KEY);
      expect(stored()).toEqual(emptyMockDbData());
    });

    it('JSON без ожидаемой структуры → тот же защитный путь', () => {
      spyOn(console, 'warn');
      for (const broken of ['null', '"строка"', '[]', '{"users":"не массив"}', '{"users":[],"diary":[]}']) {
        localStorage.clear();
        localStorage.setItem(DB_KEY, broken);
        expect(new MockDb().read()).toEqual(emptyMockDbData());
      }
      expect(console.warn).toHaveBeenCalledTimes(5);
    });
  });

  describe('валидное сохранённое состояние', () => {
    it('читается как есть: без предупреждения и без перезаписи ключа', () => {
      const persisted = JSON.stringify({ ...emptyMockDbData(), users: [makeUser('alex')] });
      localStorage.setItem(DB_KEY, persisted);
      spyOn(console, 'warn');
      const db = new MockDb();
      expect(db.read().users[0].email).toBe('alex@example.com');
      expect(console.warn).not.toHaveBeenCalled();
      expect(localStorage.getItem(DB_KEY)).toBe(persisted);
    });
  });

  describe('мутации (персистентность)', () => {
    it('изменение сериализуется в localStorage после каждого mutate', () => {
      const db = new MockDb();
      db.mutate((data) => data.users.push(makeUser('alex')));
      expect(stored().users.map((u) => u.email)).toEqual(['alex@example.com']);
      db.mutate((data) => data.diary.push(makeDiary(makeUser('alex').id, '2026-01-01')));
      expect(stored().diary.length).toBe(1);
    });

    it('mutate возвращает результат функции', () => {
      const db = new MockDb();
      const result = db.mutate((data) => {
        data.settings.push(makeSettings('user-1'));
        return data.settings.length;
      });
      expect(result).toBe(1);
    });

    it('атомарность: выброс внутри mutate не меняет ни память, ни localStorage', () => {
      const db = new MockDb();
      db.mutate((data) => data.users.push(makeUser('alex')));
      const before = localStorage.getItem(DB_KEY);
      expect(() =>
        db.mutate((data) => {
          data.users.push(makeUser('ghost'));
          throw new Error('отказ обработчика');
        }),
      ).toThrowError('отказ обработчика');
      expect(db.read().users.map((u) => u.email)).toEqual(['alex@example.com']);
      expect(localStorage.getItem(DB_KEY)).toBe(before);
    });
  });

  describe('изоляция снимков', () => {
    it('read() возвращает клон: правка результата не влияет на память и хранилище', () => {
      const db = new MockDb();
      const snapshot = db.read();
      snapshot.users.push(makeUser('ghost'));
      const before = localStorage.getItem(DB_KEY);
      expect(db.read().users).toEqual([]);
      expect(localStorage.getItem(DB_KEY)).toBe(before);
    });

    it('новый экземпляр читает обновлённые данные (гидратация при старте)', () => {
      const first = new MockDb();
      first.mutate((data) => data.users.push(makeUser('alex')));
      const second = new MockDb();
      expect(second.read().users[0].email).toBe('alex@example.com');
    });
  });
});
