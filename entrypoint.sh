#!/bin/sh

set -e

echo "Ожидание готовности БД..."
until pg_isready -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER"; do
  echo "PostgreSQL недоступна - ждём..."
  sleep 2
done

echo "PostgreSQL готова! Запуск миграций..."
npx knex migrate:latest
echo "Миграции применены. Запуск приложения..."
npm run start