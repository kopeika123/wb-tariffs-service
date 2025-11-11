import { Knex } from 'knex';

/**
 * Миграция для создания таблицы `tariffs` в базе данных.
 *
 * Структура таблицы:
 * - id: первичный ключ
 * - date: дата тарифа
 * - box_size: условный размер коробки (например, 30)
 * - coefficient: коэффициент доставки (до 5 знаков, 2 после запятой)
 * - warehouse_name: название склада
 * - geo_name: географический регион (опционально)
 * - is_marketplace: флаг, указывающий на маркетплейс-доставку
 * - updated_at: временная метка обновления
 *
 * Уникальный индекс: комбинация (date, box_size, warehouse_name, is_marketplace)
 *
 * Используется для хранения исторических данных о коэффициентах доставки с Wildberries.
 */
export async function up(knex: Knex): Promise<void> {
  return knex.schema.createTable('tariffs', (table) => {
    table.increments('id').primary();
    table.date('date').notNullable().index();
    table.integer('box_size').notNullable(); // Условный размер коробки (API не указывает)
    table.decimal('coefficient', 5, 2).notNullable(); // Коэффициент доставки
    table.string('warehouse_name', 255).notNullable(); // Название склада
    table.string('geo_name', 255); // Географический регион (например, "Узбекистан")
    table.boolean('is_marketplace').defaultTo(false); // Является ли доставка через маркетплейс
    table.timestamp('updated_at').defaultTo(knex.fn.now()); // Время последнего обновления

    // Уникальный ключ для предотвращения дубликатов
    table.unique(['date', 'box_size', 'warehouse_name', 'is_marketplace']);
  });
}

/**
 * Откат миграции: удаление таблицы `tariffs`.
 */
export async function down(knex: Knex): Promise<void> {
  return knex.schema.dropTable('tariffs');
}