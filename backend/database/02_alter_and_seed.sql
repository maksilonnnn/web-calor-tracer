-- 02_alter_and_seed.sql
-- Догоняющие изменения схемы и идемпотентный сид каталога продуктов.
-- Запускать после 01_create_tables.sql:
--
--   psql -h localhost -U postgres -d calorie-tracker-web -f database/02_alter_and_seed.sql
--
-- Скрипт можно запускать повторно:
--   * колонка position и её индекс создаются только при отсутствии;
--   * категории вставляются с ON CONFLICT DO NOTHING;
--   * продукты каталога добавляются только те, которых ещё нет (сравнение
--     по названию без учёта регистра).
-- Демо-пользователи и демо-дневник здесь НЕ создаются: в Postgres-режиме
-- DatabaseSeeder не запускается, пользователь регистрируется через API.
SET client_encoding = 'UTF8';

BEGIN;

-- Колонка position появилась в схеме позже остальных: нужна для стабильного
-- порядка позиций внутри приёма пищи (ORDER BY i.position в SqlDiaryRepository).
ALTER TABLE meal_items
    ADD COLUMN IF NOT EXISTS position bigint GENERATED ALWAYS AS IDENTITY;

CREATE INDEX IF NOT EXISTS ix_meal_items_meal_position ON meal_items (meal_id, position);

-- Категории каталога.
INSERT INTO product_categories (name)
VALUES
    ('Мясо'),
    ('Крупы'),
    ('Яйца'),
    ('Выпечка'),
    ('Молочные'),
    ('Фрукты')
ON CONFLICT (name) DO NOTHING;

-- Каталог продуктов (значения на 100 г), совпадает с ProductCatalog в
-- Infrastructure/InMemory/Seed. Повторный запуск не создаёт дубликатов.
WITH catalog (name, calories, protein, fat, carbs, category_name) AS (
    VALUES
        ('Куриная грудка'::varchar, 165::double precision, 31::double precision, 3.6::double precision, 0::double precision, 'Мясо'::varchar),
        ('Рис белый', 130, 2.7, 0.3, 28, 'Крупы'),
        ('Яйцо куриное', 155, 13, 11, 1.1, 'Яйца'),
        ('Хлеб белый', 265, 9, 3.2, 49, 'Выпечка'),
        ('Молоко 2.5%', 52, 2.8, 2.5, 4.7, 'Молочные'),
        ('Яблоко', 52, 0.3, 0.2, 14, 'Фрукты'),
        ('Творог 5%', 121, 17, 5, 1.8, 'Молочные'),
        ('Гречка', 132, 4.2, 1.6, 25, 'Крупы')
)
INSERT INTO products (name, category_id, calories, protein, fat, carbs, is_catalog)
SELECT c.name, cat.id, c.calories, c.protein, c.fat, c.carbs, true
FROM catalog c
LEFT JOIN product_categories cat ON cat.name = c.category_name
WHERE NOT EXISTS (
    SELECT 1
    FROM products p
    WHERE p.is_catalog
      AND lower(p.name) = lower(c.name)
);

COMMIT;
