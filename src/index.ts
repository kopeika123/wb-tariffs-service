import 'dotenv/config';
import { startScheduler } from './utils/cronScheduler';

console.log('Запуск сервиса сбора тарифов WB...');

startScheduler();