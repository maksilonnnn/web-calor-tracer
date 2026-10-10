import {
  DEFAULT_SETTINGS,
  MEAL_TYPES,
  MEAL_TYPE_ICONS,
  MEAL_TYPE_LABELS,
  STORAGE_KEYS,
} from './models';

describe('models — константы и словари', () => {
  it('STORAGE_KEYS имеют префикс calorie-tracker.', () => {
    for (const key of Object.values(STORAGE_KEYS)) {
      expect(key.startsWith('calorie-tracker.')).toBeTrue();
    }
  });

  it('порядок приёмов пищи фиксирован: завтрак, обед, ужин, перекус', () => {
    expect(MEAL_TYPES).toEqual(['breakfast', 'lunch', 'dinner', 'snack']);
  });

  it('словари подписей и иконок покрывают все приёмы пищи', () => {
    for (const type of MEAL_TYPES) {
      expect(MEAL_TYPE_LABELS[type]).toBeTruthy();
      expect(MEAL_TYPE_ICONS[type]).toBeTruthy();
    }
  });

  it('настройки по умолчанию: 2500/150/83/300, г, уведомления включены', () => {
    expect(DEFAULT_SETTINGS).toEqual({
      dailyCalories: 2500,
      dailyProtein: 150,
      dailyFat: 83,
      dailyCarbs: 300,
      weightUnit: 'g',
      notificationsEnabled: true,
    });
  });
});
