import { WildberriesProvider } from '../providers/WildberriesProvider';
import { TariffRepository } from '../repositories/TariffRepository';
import { GoogleSheetsService } from './GoogleSheetsService';

/**
 * Основной сервис для выполнения цикла обновления тарифов.
 *
 * Процесс:
 * 1. Получение данных с API Wildberries
 * 2. Сохранение в локальную PostgresSQL базу
 * 3. Отправка данных в Google Таблицу
 *
 * Используется в cron-расписании для автоматического обновления каждую минуту (в dev).
 */
export class TariffService {
  /**
   * @param wbProvider - Провайдер для получения тарифов с Wildberries
   * @param repository - Репозиторий для сохранения данных в БД
   * @param googleSheetsService - Сервис для отправки данных в Google Таблицу
   */
  constructor(
    private wbProvider: WildberriesProvider,
    private repository: TariffRepository,
    private googleSheetsService: GoogleSheetsService
  ) {}

  /**
   * Основной метод выполнения цикла обновления тарифов.
   *
   * Выполняется по расписанию (см. cronScheduler.ts).
   *
   * @returns Promise<void>
   */
  async execute(): Promise<void> {
    console.log('Запуск получения тарифов с Wildberries...');

    // Шаг 1: Получение данных с API Wildberries
    const tariffs = await this.wbProvider.getTariffs();
    console.log(`Получено ${tariffs.length} тарифов`);

    // Шаг 2: Сохранение в локальную базу данных
    await this.repository.saveAll(tariffs);

    // Шаг 3: Отправка данных в Google Таблицу
    await this.googleSheetsService.send(tariffs);

    console.log('Тарифы успешно сохранены и отправлены в Google Таблицу');
  }
}