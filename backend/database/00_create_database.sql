-- 00_create_database.sql
-- Создаёт базу данных приложения. Запускать, подключившись к служебной базе
-- postgres (не к самой создаваемой базе):
--
--   psql -h localhost -U postgres -d postgres -f database/00_create_database.sql
--
-- Повторный запуск безопасен: существующая база не пересоздаётся.
-- Используется psql-команда \gexec; в pgAdmin выполните CREATE DATABASE вручную.
SELECT 'CREATE DATABASE "calorie-tracker-web" WITH OWNER = postgres ENCODING = ''UTF8'' TEMPLATE = template0'
WHERE NOT EXISTS (SELECT 1 FROM pg_database WHERE datname = 'calorie-tracker-web')\gexec
