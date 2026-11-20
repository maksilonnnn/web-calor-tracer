-- 04_add_login.sql
-- Логин пользователя: уникальное имя для входа (как в эталонном образце).
-- Вход в системе теперь выполняется по логину, email остаётся контактом.
-- Запускать после 01_create_tables.sql (и 02_alter_and_seed.sql, 03_add_auth_columns.sql):
--
--   psql -h localhost -U postgres -d calorie-tracker-web -f database/04_add_login.sql
--
-- Скрипт идемпотентен: повторный запуск не меняет существующие значения.
-- Существующим пользователям логин выводится из локальной части email
-- (недопустимые символы заменяются на «-», длина ограничена 100).
SET client_encoding = 'UTF8';

BEGIN;

ALTER TABLE users
    ADD COLUMN IF NOT EXISTS login varchar(100);

-- Бэкфилл: локальная часть email в нижнем регистре, только допустимые символы.
UPDATE users
SET login = left(
    regexp_replace(lower(split_part(email, '@', 1)), '[^A-Za-z0-9._-]', '-', 'g'),
    100)
WHERE login IS NULL OR btrim(login) = '';

-- Редкие коллизии бэкфилла (два email с одинаковой локальной частью без
-- учёта регистра): второй и последующие получают суффикс из начала id.
UPDATE users u
SET login = left(u.login || '-' || substring(u.id::text FROM 1 FOR 8), 100)
WHERE u.id IN (
    SELECT id
    FROM (
        SELECT id,
               row_number() OVER (PARTITION BY lower(login) ORDER BY created_at, id) AS rn
        FROM users
        WHERE login IS NOT NULL
    ) ranked
    WHERE ranked.rn > 1
);

ALTER TABLE users ALTER COLUMN login SET NOT NULL;

CREATE UNIQUE INDEX IF NOT EXISTS ux_users_login ON users (lower(login));

-- Формат логина как на клиенте: латиница, цифры, точка, дефис, подчёркивание.
-- ADD CONSTRAINT без IF NOT EXISTS не поддерживается — проверка через DO-блок.
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'ck_users_login_format'
    ) THEN
        ALTER TABLE users
            ADD CONSTRAINT ck_users_login_format
            CHECK (login ~ '^[A-Za-z0-9._-]{1,100}$');
    END IF;
END $$;

COMMIT;
