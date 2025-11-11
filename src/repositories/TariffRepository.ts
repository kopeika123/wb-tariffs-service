import { Knex } from 'knex';
import { TariffData } from '../core/interfaces';
import config from '../../knexfile';
import knex from 'knex';

/**
 * Репозиторий для работы с тарифами в базе данных.
 *
 * Отвечает за:
 * - Подключение к PostgresSQL через Knex
 * - Сохранение массива тарифов с поддержкой UPSERT (вставка или обновление)
 * - Управление транзакциями для согласованности данных
 * - Логирование успешных операций и ошибок
 */
export class TariffRepository {
  private db: Knex;

  /**
   * Создаёт экземпляр репозитория и инициализирует подключение к БД.
   *
   * Использует конфигурацию из `knexfile.ts` в зависимости от переменной окружения `NODE_ENV`.
   */
  constructor() {
    this.db = knex(config[process.env.NODE_ENV || 'development']);
  }

  /**
   * Асинхронно сохраняет массив тарифов в базу данных.
   *
   * Если запись с такой же датой, размером коробки, названием склада и типом доставки
   * уже существует — обновляется только поле `coefficient` и `updated_at`.
   *
   * Используется транзакция для обеспечения целостности данных.
   *
   * @param tariffs - Массив объектов `TariffData` для сохранения
   * @returns Promise<void>
   * @throws Ошибка при сбое транзакции или SQL-ошибке
   */
  async saveAll(tariffs: TariffData[]): Promise<void> {
    const trx = await this.db.transaction();
    const today = new Date().toISOString().split('T')[0]; // Текущая дата в формате YYYY-MM-DD

    try {
      // Обработка каждого тарифа
      for (const tariff of tariffs) {
        await trx('tariffs')
          .insert({
            date: today,
            box_size: tariff.boxSize,
            coefficient: tariff.coefficient,
            warehouse_name: tariff.warehouseName,
            geo_name: tariff.geoName,
            is_marketplace: tariff.isMarketplace,
            updated_at: this.db.fn.now()
          })
          .onConflict(['date', 'box_size', 'warehouse_name', 'is_marketplace'])
          .merge({
            coefficient: this.db.ref('excluded.coefficient'),
            updated_at: this.db.fn.now()
          });
      }

      // Фиксация транзакции
      await trx.commit();
      console.log(`${tariffs.length} тарифов успешно сохранено в базу данных`);
    } catch (error) {
      // Откат транзакции при ошибке
      await trx.rollback();
      console.error('Ошибка при сохранении тарифов в базу данных:', error);
      throw error;
    }
  }
}