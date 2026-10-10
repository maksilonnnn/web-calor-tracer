# Трекер калорий — frontend (Angular) + backend (ASP.NET Core)

Учебный проект «Трекер калорий»: SPA на Angular 20 и REST API на C#/ASP.NET
Core (net10.0) в стиле DDD. Backend хранит данные в **in-memory заглушке**
(без реальной БД и EF Core), frontend общается с ним по HTTP; браузерного
мок-слоя больше нет.

Репозиторий содержит обе части:

- Angular-приложение — **в корне** репозитория (`src/`, `angular.json`, …);
- backend — в каталоге **`backend/`** (`CalorieTracker.sln`: `CalorieTracker.Api` + `CalorieTracker.Tests`).

## Требования

- **.NET SDK 10** (LTS) — проверено на `net10.0`;
- **Node.js** 20.19+, 22.12+ или 24.x и **npm** 10+;
- **Chrome** или **Edge** для headless-тестов клиента.

## Быстрый старт

Терминал 1 — backend:

```powershell
cd backend\CalorieTracker.Api
dotnet user-secrets set "Auth:JwtKey" "<секрет не короче 32 символов>"
dotnet run
# http://localhost:5254, Swagger UI: http://localhost:5254/swagger
```

Терминал 2 — frontend (из корня репозитория):

```powershell
npm install
npm start
# http://localhost:4200 — запросы /api проксируются на http://localhost:5254
```

Демо-учётка (создаётся сидом): **alex@example.com / Demo1234!**
(имя — «Алексей»). Можно зарегистрировать нового пользователя — его дневник,
настройки и профиль хранятся отдельно.

## Backend

### Структура решения

```
backend/
  CalorieTracker.sln
  CalorieTracker.Api/
    Domain/            # ядро: сущности, объекты-значения, сервисы, интерфейсы репозиториев
      Common/          # PagedResult<T>, пагинация, парсер дат, ошибки валидации
      Entities/        # User, UserSettings, Product, DiaryEntry, Meal, MealItem
      ValueObjects/    # Email, PersonName, ProductName, NutritionFacts, GramAmount
      Services/        # AuthService, DiaryService, DashboardService, SettingsService, ProfileService, ProductService
      Repositories/    # интерфейсы репозиториев
      Nutrition/       # расчёт пищевой ценности
      Models/          # команды и модели дашборда
      Security/        # контракты хеширования и токенов
    Infrastructure/    # заглушка-хранилище, сид, безопасность, настройки, DI
      InMemory/        # InMemoryDatabase + репозитории на словарях
      InMemory/Seed/   # DatabaseSeeder, каталог продуктов
      Security/        # JwtTokenService (HS256), Pbkdf2PasswordHasher
      Options/         # Auth/Cors/Persistence/Seed
      DependencyInjection.cs
    Presentation/      # REST-контроллеры, DTO, middleware, DI
      Controllers/     # Auth, Diary, Dashboard, Settings, Me, Products, Health
      Contracts/       # DTO запросов/ответов
      Middleware/      # RequestLogging, ExceptionHandling
      Mapping/         # DtoMapper
      DependencyInjection.cs
  CalorieTracker.Tests/  # xUnit: доменные тесты + интеграционные (WebApplicationFactory)
```

**Направление зависимостей:** `Presentation → Domain ← Infrastructure`.
`Domain` не зависит от инфраструктуры и фреймворков: репозитории объявлены
интерфейсами, сервисы домена регистрируются в `Infrastructure.DependencyInjection`.

### Конфигурация

Источники: `appsettings.json` + `appsettings.Development.json` (Options pattern
с валидацией на старте).

| Секция              | Ключ                            | Назначение                                             |
|---------------------|---------------------------------|--------------------------------------------------------|
| `Auth`              | `JwtKey`                        | Секрет подписи JWT (HS256), **минимум 32 символа**     |
| `Auth`              | `Issuer`                        | Издатель токена (`iss`)                                |
| `Auth`              | `AccessTtlMinutes`              | Время жизни access-токена (минуты)                     |
| `Auth`              | `CookieName`                    | Имя httpOnly-cookie (`access_token`)                   |
| `Cors`              | `AllowedOrigins`                | Список разрешённых источников браузерного UI           |
| `Persistence`       | `Provider`                      | `InMemory` (единственное поддерживаемое значение)      |
| `Seed`              | `Enabled`                       | Заполнять ли заглушку демо-данными при старте          |

`JwtKey` в репозитории пустой (плейсхолдер). Реальный ключ задаётся через
user-secrets или переменную окружения **`Auth__JwtKey`**. Если ключ не задан
или короче 32 символов, приложение **падает на старте** с понятным сообщением.
Файлы с секретами исключены через `backend/.gitignore`.

### Запуск

```powershell
cd backend
dotnet restore
dotnet run --project CalorieTracker.Api
```

Профиль `http` (по умолчанию через `dotnet run`) слушает
`http://localhost:5254`; профиль `https` дополнительно слушает
`https://localhost:7036`. Именно на `http://localhost:5254` настроен прокси
клиента.

### Swagger

В окружении `Development` доступен Swagger UI:
`http://localhost:5254/swagger` (спецификация —
`/swagger/v1/swagger.json`). У методов оформлены описания и коды ответов
(`[ProducesResponseType]`).

### Тесты

```powershell
cd backend
dotnet test CalorieTracker.sln
```

xUnit: доменные unit-тесты (объекты-значения, расчёты, валидация) и
интеграционные тесты через `WebApplicationFactory` (успешные сценарии,
400/401/404/409, границы пагинации, `totalCount`, доступ к чужим данным → 404,
формат ошибок, отсутствие `passwordHash` в ответах).

### REST API (`/api/v1`)

| Метод, путь                              | Успех | Назначение                                             |
|------------------------------------------|:-----:|--------------------------------------------------------|
| `POST /auth/register`                    | 201   | Регистрация, ставит httpOnly-cookie с JWT              |
| `POST /auth/login`                       | 200   | Вход, ставит httpOnly-cookie с JWT                     |
| `POST /auth/logout`                      | 204   | Выход, удаляет cookie                                  |
| `GET  /auth/me`                          | 200   | Текущий пользователь (401 — если сессии нет)           |
| `GET  /diary?date=YYYY-MM-DD`            | 200   | Дневник за дату (всегда четыре приёма пищи)            |
| `POST /diary/items`                      | 201   | Добавить продукт в приём пищи                          |
| `PUT  /diary/items/{itemId}`             | 200   | Изменить позицию: количество и/или данные продукта (на 100 г) |
| `DELETE /diary/items/{itemId}`           | 200   | Удалить позицию                                        |
| `GET  /diary/history?page&pageSize`      | 200   | История дневника постранично (даты по убыванию)        |
| `GET  /dashboard?date=YYYY-MM-DD`        | 200   | Агрегат дня: итоги, приёмы, недавние продукты, нормы   |
| `GET  /settings`                         | 200   | Настройки пользователя                                 |
| `PUT  /settings`                         | 200   | Частичное обновление настроек                          |
| `GET  /me`                               | 200   | Профиль текущего пользователя                          |
| `PUT  /me`                               | 200   | Изменить имя/e-mail                                    |
| `PUT  /me/password`                      | 204   | Смена пароля                                           |
| `DELETE /me`                             | 204   | Удалить аккаунт вместе с данными                       |
| `GET  /products?page&pageSize`           | 200   | Каталог продуктов постранично (по названию)            |
| `GET  /health`                           | 200   | Проверка живости (без авторизации)                     |

Все методы, кроме `health`, `auth/register`, `auth/login`, требуют
аутентификации. Идентификаторы — строки uuid, даты — `YYYY-MM-DD`, перечисления
— строки в нижнем регистре; JSON в camelCase.

### Формат ошибок

Единый для всех отказов:

```json
{ "message": "…", "errors": { "field": ["текст"] } }
```

Поле `errors` присутствует только у 400 «Данные заполнены неверно». Тексты
сообщений совпадают со словарём клиента
(`src/app/shared/validation/error-texts.ts`).

| Код | Сообщение                                                                 |
|----:|---------------------------------------------------------------------------|
| 400 | `Данные заполнены неверно` (+ `errors`), `Некорректная дата`, `Некорректный идентификатор`, `Неверный текущий пароль` |
| 401 | `Не авторизован` (вход — `Неверный email или пароль`)                     |
| 404 | `Запись не найдена` (в т. ч. для чужих ресурсов — защита от IDOR)         |
| 409 | `Пользователь с таким email уже существует`                               |

### Аутентификация

- JWT (HS256) хранится в **httpOnly** cookie `access_token`, `SameSite=Strict`
  (вне Development — ещё и `Secure`); из JavaScript токен недоступен.
- Пароли — PBKDF2-SHA256, 210 000 итераций, случайная соль, сравнение с
  постоянным временем.
- `userId` берётся **только** из claims токена; все данные фильтруются по
  пользователю (идемпотентная защита от IDOR).

### Middleware

1. `RequestLoggingMiddleware` — метод, путь, статус, время выполнения (без
   паролей и персональных данных);
2. `ExceptionHandlingMiddleware` — перехватывает исключения, отдаёт единый
   формат ошибки, не раскрывает стектрейс.

### Хранилище-заглушка и как заменить на реальную БД

Данные живут в `Infrastructure/InMemory` (потокобезопасные словари
`InMemoryDatabase`), доступ — через интерфейсы `Domain/Repositories`.
EF Core, миграции и реальная СУБД **не используются** (по условию задания).

Замена на настоящую БД:

1. реализуйте интерфейсы из `Domain/Repositories` над EF Core/Dapper (например,
   `EfUserRepository`, `EfDiaryRepository`, …);
2. зарегистрируйте их в `Infrastructure/DependencyInjection.cs` вместо
   `InMemory*` при соответствующем значении `Persistence:Provider`;
3. при необходимости замените `DatabaseSeeder` (он вызывается из `Program.cs`
   и работает через те же интерфейсы репозиториев, поэтому остаётся валидным).

## Frontend

### Стек и запуск

Angular 20 (standalone, signals, новый control flow), TypeScript 5.8 (strict),
RxJS, reactive forms, Karma + Jasmine. UI-библиотеки не подключены.

```powershell
npm install
npm start     # ng serve + proxy.conf.json: /api → http://localhost:5254
npm run build # production-сборка в dist/
npm test      # unit-тесты (headless)
```

`npm test` использует `ChromeHeadless`. Если Chrome не установлен, укажите
браузер в `CHROME_BIN`, например Edge:

```powershell
$env:CHROME_BIN = "C:\Program Files (x86)\Microsoft\Edge\Application\msedge.exe"
npm test
```

### Связь с backend

- `provideHttpClient` с функциональными интерцепторами
  (`src/app/core/http/api-prefix.interceptor.ts`,
  `src/app/core/http/api-error.interceptor.ts`);
- базовый префикс `/api/v1` задан в одном InjectionToken —
  `src/app/core/config/api-base-url.ts`;
- интерцептор добавляет `withCredentials` (cookie с JWT) и приводит любой сбой
  к доменной форме `ApiError { status, body: { message, errors? } }`;
- 401 на защищённых запросах сбрасывает кэш пользователя и ведёт на `/login`
  (для `/auth/*` редиректа нет — этим управляет `AuthService.loadMe()`);
- в дев-режиме запросы проксируются на Kestrel через `proxy.conf.json`.

Сессия не хранится в `localStorage`: guards вызывают `AuthService.loadMe()`
(`GET /auth/me`), а `401` трактуется как «гость».

### Структура каталогов

```
src/app/
  core/
    config/        app.config.ts, app.routes.ts, api-base-url.ts
    http/          api-prefix.interceptor.ts, api-error.interceptor.ts
    navigation/    guards.ts
    services/      auth, diary, dashboard, settings, profile, product, theme
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
    auth/          pages/login/, pages/register/
    dashboard/     pages/dashboard/, components/add-food-modal/
    diary/         pages/diary/
    settings/      pages/settings/
```

Правила: страницы работают только с сервисами `core/services`; у каждого
компонента четыре файла (`.ts` + `.html` + `.css` + `.spec.ts`); состояние —
сигналы; все компоненты `ChangeDetectionStrategy.OnPush`.

## Тесты (итог)

```powershell
cd backend;                 dotnet test CalorieTracker.sln   # 74 теста
cd ..;                      npm test                          # 190 тестов
```

## Документация

- [Пользовательские истории](5 историй.txt) (копия — [docs/user-stories.md](docs/user-stories.md))
- Скриншоты экранов: `Главная страница.png`, `Дневник.png`, `Настройки.png`, `Страница регистрации.png` — в корне репозитория (копии — [docs/screens/](docs/screens/))
