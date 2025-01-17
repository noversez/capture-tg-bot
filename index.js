require('dotenv').config();
const TelegramBot = require('node-telegram-bot-api');
const { setupCaptcha } = require('./src/captcha'); // Импортируем файл с логикой капчи

// Токен бота из .env файла
const BOT_TOKEN = process.env.BOT_TOKEN;
const CAPTCHA_TIMEOUT = parseInt(process.env.CAPTCHA_TIMEOUT || '60000', 10);

// Проверка наличия токена
if (!BOT_TOKEN) {
  throw new Error('BOT_TOKEN не указан в .env файле');
}

// Создаем экземпляр бота
const bot = new TelegramBot(BOT_TOKEN, { polling: true });

// Настроим капчу
setupCaptcha(bot, CAPTCHA_TIMEOUT);

// Запускаем бота
console.log('Бот запущен и ожидает новых участников...');
