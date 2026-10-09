# Calorie Tracker (Angular)

Учебный frontend-прототип трекера калорий: регистрация и вход, дневник питания,
сводка за день и настройки профиля. Бэкенда нет — вместо него детерминированный
мок-слой на `localStorage`, полностью спрятанный за сервисами `core/services`.

Пользовательские сценарии ограничены пятью историями: см.
[`docs/user-stories.md`](docs/user-stories.md).

## Стек

- **Angular 20** (standalone-компоненты, signals, новый control flow)
- **TypeScript 5.8** в строгом режиме (`strict`, `strictTemplates`, `noPropertyAccessFromIndexSignature`)
- **RxJS 7.8**, `@angular/forms` (реактивные формы)
- **Karma + Jasmine** для тестов (`ng test --watch=false --browsers=ChromeHeadless`)
- Свои shared-компоненты; PrimeNG и другие UI-библиотеки **не** подключены

## Требования

- **Node.js** 20.19+, 22.12+ или 24.x
- **npm** 10+
- Браузер Chrome или Edge (для headless-тестов)

## Установка и запуск

```bash
npm install     # установить зависимости
npm start       # запустить дев-сервер (http://localhost:4200)
npm run build   # production-сборка в dist/
npm test        # unit-тесты (headless Chrome, без watch)
```

`npm test` ожидает установленный Chrome. Если Chrome не найден, укажите путь к
браузеру в переменной окружения `CHROME_BIN`, например для Edge:

```powershell
$env:CHROME_BIN = "C:\Program Files (x86)\Microsoft\Edge\Application\msedge.exe"
npm test
```

## Демо-учётка

Мок-слой при первом запуске сам создаёт демо-пользователя:

| Поле   | Значение            |
|--------|---------------------|
| Имя    | `Алексей`           |
| Email  | `alex@example.com`  |
| Пароль | `Demo1234!`         |

Можно также зарегистрировать нового пользователя — данные каждого пользователя
(дневник и настройки) хранятся отдельно по его `userId`.

## Сброс данных

Все данные приложения лежат в `localStorage` под ключами с префиксом
`calorie-tracker.`:

- `calorie-tracker.mock.db.v1` — «база данных» мока (пользователи, дневник, настройки);
- `calorie-tracker.session.userId` — текущая сессия;
- `calorie-tracker.theme` — выбранная тема оформления (светлая/тёмная).

Чтобы сбросить приложение к исходному состоянию, очистите эти ключи в консоли
браузера (DevTools → Application → Local Storage) или выполните:

```js
Object.keys(localStorage)
  .filter((key) => key.startsWith('calorie-tracker.'))
  .forEach((key) => localStorage.removeItem(key));
location.reload();
```

После перезагрузки мок-слой заново создаст БД и наполнит её детерминированным
сидом (сегодня и два предыдущих дня).

## Структура каталогов

Внутри `src/app` только пять веток: `core`, `mock`, `shared`, `layout`, `features`.

```
src/app/
  core/
    config/        app.config.ts, app.routes.ts
    navigation/    guards.ts (+ spec)
    services/      auth, dashboard, diary, settings, profile, theme (+ spec у каждого)
  mock/
    index.ts                 setupMockLayer()
    mock-api-client.ts, mock-db.ts, mock-error.ts, ids.ts, seed.ts
    auth/ (handlers.ts, session-store.ts)  diary/  dashboard/  settings/  profile/
  shared/
    models.ts, api-error.ts, dates.ts, calculations.ts, units.ts
    validation/    validators.ts, error-texts.ts
    loading/       submitting.ts
    notifications/ notification-service.ts + компонент тоста
    components/    button, card, input, modal, progress-bar, toggle, theme-toggle
  layout/
    app-root/      <app-toast /> + <router-outlet />
    app-shell/     сайдбар + <router-outlet />
    sidebar/
  features/
    auth/          auth.routes.ts, pages/login/, pages/register/
    dashboard/     dashboard.routes.ts, pages/dashboard/, components/add-food-modal/
    diary/         diary.routes.ts, pages/diary/
    settings/      settings.routes.ts, pages/settings/
```

Архитектурные правила:

- страницы и компоненты **никогда** не импортируют `mock/` — только сервисы из
  `core/services`; единственное исключение — `core/config/app.config.ts`, где
  вызывается `setupMockLayer()`;
- у каждого компонента четыре файла: `.ts` + `.html` + `.css` + `.spec.ts`
  (`templateUrl` / `styleUrl`, без inline-шаблонов и стилей);
- все сервисы возвращают `Promise` и общаются с мок-слоем через
  `MockApiClient.call<T>('домен.метод', params)`;
- состояние — сигналы, все компоненты `ChangeDetectionStrategy.OnPush`.

## Документация

- [Пользовательские истории](docs/user-stories.md)
- [Скриншоты экранов](docs/screens/)
