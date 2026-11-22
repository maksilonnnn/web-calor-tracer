-- 01_create_tables.sql
-- Схема базы calorie-tracker-web. Запускать после 00_create_database.sql:
--
--   psql -h localhost -U postgres -d calorie-tracker-web -f database/01_create_tables.sql
--
-- Миграции EF Core не используются: схема полностью описана этими скриптами.
SET client_encoding = 'UTF8';

BEGIN;

-- Пользователи. Email уникален без учёта регистра.
CREATE TABLE IF NOT EXISTS users (
    id            uuid         PRIMARY KEY DEFAULT gen_random_uuid(),
    name          varchar(100) NOT NULL CHECK (length(btrim(name)) BETWEEN 1 AND 100),
    email         varchar(254) NOT NULL,
    password_hash text         NOT NULL CHECK (btrim(password_hash) <> ''),
    created_at    timestamptz  NOT NULL DEFAULT now()
);
CREATE UNIQUE INDEX IF NOT EXISTS ux_users_email ON users (lower(email));

-- Настройки пользователя (1:1). Значения по умолчанию совпадают с
-- UserSettings.CreateDefault в домене.
CREATE TABLE IF NOT EXISTS user_settings (
    user_id               uuid             PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
    daily_calories        double precision NOT NULL DEFAULT 2500 CHECK (daily_calories >= 0),
    daily_protein         double precision NOT NULL DEFAULT 150  CHECK (daily_protein  >= 0),
    daily_fat             double precision NOT NULL DEFAULT 83   CHECK (daily_fat      >= 0),
    daily_carbs           double precision NOT NULL DEFAULT 300  CHECK (daily_carbs    >= 0),
    weight_unit           text             NOT NULL DEFAULT 'g'  CHECK (weight_unit IN ('g', 'kg')),
    notifications_enabled boolean          NOT NULL DEFAULT true
);

-- Категории каталога продуктов.
CREATE TABLE IF NOT EXISTS product_categories (
    id   integer     GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    name varchar(100) NOT NULL UNIQUE
);

-- Продукты. is_catalog = true — запись каталога, false — снимок продукта
-- внутри позиции дневника (создаётся SqlDiaryRepository).
CREATE TABLE IF NOT EXISTS products (
    id          uuid             PRIMARY KEY DEFAULT gen_random_uuid(),
    name        varchar(100)     NOT NULL CHECK (length(btrim(name)) BETWEEN 1 AND 100),
    category_id integer          REFERENCES product_categories(id) ON DELETE SET NULL,
    calories    double precision NOT NULL CHECK (calories >= 0),
    protein     double precision NOT NULL CHECK (protein  >= 0),
    fat         double precision NOT NULL CHECK (fat      >= 0),
    carbs       double precision NOT NULL CHECK (carbs    >= 0),
    is_catalog  boolean          NOT NULL DEFAULT true
);
CREATE INDEX IF NOT EXISTS ix_products_category ON products (category_id);
CREATE INDEX IF NOT EXISTS ix_products_name     ON products (lower(name)) WHERE is_catalog;

-- Дневник: одна запись на пользователя и дату.
CREATE TABLE IF NOT EXISTS diary_entries (
    id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id    uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    entry_date date NOT NULL,
    UNIQUE (user_id, entry_date)
);

-- Приёмы пищи: ровно четыре типа на запись дня.
CREATE TABLE IF NOT EXISTS meals (
    id             uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    diary_entry_id uuid NOT NULL REFERENCES diary_entries(id) ON DELETE CASCADE,
    meal_type      text NOT NULL CHECK (meal_type IN ('breakfast', 'lunch', 'dinner', 'snack')),
    UNIQUE (diary_entry_id, meal_type)
);

-- Позиции дневника. position задаёт стабильный порядок внутри приёма пищи:
-- SqlDiaryRepository читает позиции через ORDER BY i.position.
CREATE TABLE IF NOT EXISTS meal_items (
    id             uuid             PRIMARY KEY DEFAULT gen_random_uuid(),
    meal_id        uuid             NOT NULL REFERENCES meals(id) ON DELETE CASCADE,
    product_id     uuid             NOT NULL REFERENCES products(id) ON DELETE RESTRICT,
    quantity_grams double precision NOT NULL CHECK (quantity_grams > 0),
    position       bigint           GENERATED ALWAYS AS IDENTITY
);
CREATE INDEX IF NOT EXISTS ix_meal_items_meal          ON meal_items (meal_id);
CREATE INDEX IF NOT EXISTS ix_meal_items_product       ON meal_items (product_id);
CREATE INDEX IF NOT EXISTS ix_meal_items_meal_position ON meal_items (meal_id, position);

COMMIT;
