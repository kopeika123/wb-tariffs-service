import { google, sheets_v4 } from 'googleapis';
import { DataSink, TariffData } from '../core/interfaces';
import path from 'path';
import fs from 'fs';

/**
 * Сервис для отправки данных в Google Таблицы.
 *
 * Отвечает за:
 * - Аутентификацию с помощью сервисного аккаунта
 * - Подключение к Google Sheets API
 * - Обновление указанной таблицы с коэффициентами доставки
 * - Форматирование данных с заголовками
 * - Установку жирного форматирования для заголовков
 */
export class GoogleSheetsService implements DataSink<TariffData> {
  private sheets: sheets_v4.Sheets;

  constructor() {
    const credentialsPath = process.env.GOOGLE_SHEETS_CREDENTIALS_PATH;

    // Проверка наличия пути к файлу credentials
    if (!credentialsPath) {
      throw new Error('GOOGLE_SHEETS_CREDENTIALS_PATH не задана в .env');
    }

    const fullPath = path.resolve(credentialsPath);

    // Проверка существования файла
    if (!fs.existsSync(fullPath)) {
      throw new Error(`Файл credentials не найден: ${fullPath}`);
    }

    // Аутентификация через сервисный аккаунт
    const auth = new google.auth.GoogleAuth({
      keyFile: fullPath,
      scopes: ['https://www.googleapis.com/auth/spreadsheets'],
    });

    this.sheets = google.sheets({ version: 'v4', auth });
  }

  /**
   * Отправляет данные в Google Таблицу.
   *
   * @param data - Массив данных о коэффициентах доставки
   * @returns Promise<void>
   */
  async send(data: TariffData[]): Promise<void> {
    const sheetIds = process.env.SHEET_IDS?.split(',').map(id => id.trim()).filter(Boolean);

    if (!sheetIds?.length) {
      throw new Error('SHEET_IDS не задан или пуст в .env');
    }

    // Сортировка по коэффициенту
    const sortedData = data.sort((a, b) => a.coefficient - b.coefficient);

    // Формирование строк данных с заголовками на русском
    const rows = [
      ['Размер коробки', 'Коэффициент', 'Склад', 'Регион', 'Маркетплейс'],
      ...sortedData.map(item => [
        item.boxSize,
        item.coefficient,
        item.warehouseName,
        item.geoName || '',
        item.isMarketplace ? 'Да' : 'Нет'
      ])
    ];

    // Обновление каждой таблицы из списка
    for (const sheetId of sheetIds) {
      try {
        // Обновление диапазона таблицы
        await this.sheets.spreadsheets.values.update({
          spreadsheetId: sheetId,
          range: 'Лист1!A1:E',
          valueInputOption: 'RAW',
          requestBody: { values: rows },
        });

        // Установка жирного форматирования для заголовков
        await this.sheets.spreadsheets.batchUpdate({
          spreadsheetId: sheetId,
          requestBody: {
            requests: [
              {
                repeatCell: {
                  range: {
                    sheetId: 0, // Первый лист (по умолчанию)
                    startRowIndex: 0,
                    endRowIndex: 1,
                    startColumnIndex: 0,
                    endColumnIndex: 5,
                  },
                  cell: {
                    userEnteredFormat: {
                      textFormat: {
                        bold: true,
                      },
                    },
                  },
                  fields: 'userEnteredFormat.textFormat.bold',
                },
              },
            ],
          },
        });
      } catch (error: any) {
        // Подробная ошибка от API
        if (error.response?.data) {
          console.error('Ошибка Google Sheets API:', error.response.data);
        } else {
          console.error('Ошибка сети или аутентификации:', error.message);
        }
        throw error;
      }
    }
  }
}