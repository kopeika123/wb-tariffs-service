import { TariffService } from '../services/TariffService';
import { WildberriesProvider } from '../providers/WildberriesProvider';
import { TariffRepository } from '../repositories/TariffRepository';
import { GoogleSheetsService } from '../services/GoogleSheetsService';
import cron from 'node-cron';
import { getErrorMessage } from './errorMessage';

/**
 * Запускает планировщик задач для регулярного обновления тарифов.
 *
 * Использует библиотеку `node-cron` для выполнения задач по расписанию.
 * Расписание задаётся через переменную окружения `CRON_SCHEDULE`.
 *
 * Логика:
 * - Создаёт экземпляр `TariffService` с зависимостями
 * - Настраивает cron-задачу на выполнение по расписанию из .env
 * - Обрабатывает успешное выполнение и ошибки
 */
export function startScheduler() {
  // Создание сервиса с полной цепочкой обработки данных
  const service = new TariffService(
    new WildberriesProvider(),      // Получение данных с API Wildberries
    new TariffRepository(),         // Сохранение в PostgresSQL
    new GoogleSheetsService()       // Выгрузка в Google Таблицу
  );

  // Получение расписания из переменной окружения
  const cronSchedule = process.env.CRON_SCHEDULE || '0 * * * *'; // По умолчанию — каждый час

  /**
   * Запланированная задача: обновление тарифов по расписанию из .env
   *
   * Допустимые значения:
   *   '0 * * * *'    — каждый час в 0-й минуте
   */
  cron.schedule(cronSchedule, async () => {
    console.log(`[CRON] Запуск обновления тарифов: ${new Date().toISOString()}`);
    try {
      await service.execute(); // Выполнение полного цикла обновления
      console.log('[CRON] Успешно обновлено');
    } catch (error) {
      // Логирование ошибки с понятным сообщением
      console.error('[CRON] Ошибка:', getErrorMessage(error));
    }
  });

  console.log(`Планировщик запущен: обновление тарифов по расписанию "${cronSchedule}"`);
}