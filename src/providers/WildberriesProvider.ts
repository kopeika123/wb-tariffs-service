import axios from 'axios';
import { TariffData } from '../core/interfaces';

/**
 * Провайдер для получения данных о тарифах доставки с API Wildberries.
 *
 * Работает с эндпоинтом: `/api/v1/tariffs/box?date=YYYY-MM-DD`
 *
 * Особенности:
 * - Поддерживает извлечение коэффициентов как для обычной доставки, так и для маркетплейса
 * - Обрабатывает дробные коэффициенты, записанные через запятую (например, "100,5" → 100.5)
 * - Пропускает записи с коэффициентом "-"
 * - Формирует унифицированный массив `TariffData` для последующей обработки
 */
export class WildberriesProvider {
  /**
   * Базовый URL API Wildberries для получения тарифов.
   * Может быть переопределён через переменную окружения `WB_API_URL`.
   */
  private readonly baseUrl = process.env.WB_API_URL || 'https://common-api.wildberries.ru/api/v1/tariffs/box';

  /**
   * Асинхронно получает данные о тарифах из API Wildberries.
   *
   * @returns Promise<TariffData[]> — массив данных о коэффициентах доставки
   * @throws Ошибка при отсутствии данных, сетевой проблеме или неправильном формате ответа
   */
  async getTariffs(): Promise<TariffData[]> {
    const date = new Date().toISOString().split('T')[0]; // Формат: YYYY-MM-DD
    const url = `${this.baseUrl}?date=${date}`; // Полный URL с параметром даты

    try {
      // Выполнение GET-запроса к API с авторизацией
      const response = await axios.get(url, {
        headers: { Authorization: process.env.WB_API_KEY }
      });

      // Извлечение списка складов из ответа
      const warehouseList = response.data?.response?.data?.warehouseList;

      // Проверка, что warehouseList существует и является массивом
      if (!Array.isArray(warehouseList)) {
        throw new Error('Неверный формат ответа: отсутствует или не является массивом поле warehouseList');
      }

      // Массив для хранения обработанных тарифов
      const tariffs: TariffData[] = [];

      // Обработка каждого элемента списка складов
      warehouseList.forEach((item: any) => {
        // Добавление данных для обычной (не маркетплейсной) доставки
        if (item.boxDeliveryCoefExpr && item.boxDeliveryCoefExpr !== '-') {
          tariffs.push({
            boxSize: 30, // Условный размер коробки, так как API не указывает точный размер
            coefficient: parseFloat(item.boxDeliveryCoefExpr.replace(',', '.')), // Преобразование строки в число
            warehouseName: item.warehouseName,
            geoName: item.geoName || null, // Гео-регион (может отсутствовать)
            isMarketplace: false // Флаг: обычная доставка
          });
        }

        // Добавление данных для маркетплейсной доставки
        if (item.boxDeliveryMarketplaceCoefExpr && item.boxDeliveryMarketplaceCoefExpr !== '-') {
          tariffs.push({
            boxSize: 30,
            coefficient: parseFloat(item.boxDeliveryMarketplaceCoefExpr.replace(',', '.')),
            warehouseName: item.warehouseName,
            geoName: item.geoName || null,
            isMarketplace: true // Флаг: доставка через маркетплейс
          });
        }
      });

      return tariffs;
    } catch (error: any) {
      // Подробная обработка ошибок
      if (error.response) {
        // Ошибка от сервера Wildberries (например, 400, 401)
        console.error('Ошибка от API Wildberries:', error.response.status, error.response.data);
      } else if (error.request) {
        // Ошибка сети (нет ответа)
        console.error('Нет ответа от API Wildberries:', error.message);
      } else {
        // Ошибка при настройке запроса
        console.error('Ошибка запроса:', error.message);
      }
      throw error;
    }
  }
}