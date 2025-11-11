FROM node:22-alpine

WORKDIR /app

# Установка клиента PostgreSQL (для pg_isready)
RUN apk add --no-cache postgresql-client

# Копируем зависимости и устанавливаем
COPY package*.json ./
RUN npm ci --only=production

# Копируем исходный код
COPY . .

# Собираем проект
RUN npm run build

# Устанавливаем Knex глобально для выполнения миграций
RUN npm install -g knex

# Копируем и делаем исполняемым entrypoint
COPY entrypoint.sh /entrypoint.sh
RUN chmod +x /entrypoint.sh

# Запускаем приложение
CMD ["/entrypoint.sh"]