-- 03_add_auth_columns.sql
-- Колонки авторизации: роль пользователя и признак блокировки.
-- Запускать после 01_create_tables.sql (и 02_alter_and_seed.sql):
--
--   psql -h localhost -U postgres -d calorie-tracker-web -f database/03_add_auth_columns.sql
--
-- Скрипт идемпотентен: повторный запуск не меняет существующие значения.
-- Роль по умолчанию — 'user'. Первого администратора назначают вручную:
--
--   UPDATE users SET role = 'admin' WHERE email = 'admin@example.com';
--
-- API-эндпоинтов выдачи роли нет: роль не должна повышаться из интерфейса.
SET client_encoding = 'UTF8';

BEGIN;

ALTER TABLE users
    ADD COLUMN IF NOT EXISTS role text NOT NULL DEFAULT 'user'
        CHECK (role IN ('user', 'admin'));

ALTER TABLE users
    ADD COLUMN IF NOT EXISTS is_blocked boolean NOT NULL DEFAULT false;

COMMIT;
