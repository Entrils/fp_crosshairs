# Fragpunk Crosshairs

Production-ready галерея кодов прицелов для FragPunk с закрытой страницей `/admin`.

## Архитектура

- `client/` — React, Vite, i18n, Three.js, публичная галерея и админ-панель.
- `server/` — Express API, PostgreSQL-репозиторий, Redis, S3 и серверные тесты.
- корень проекта — npm workspaces, Docker Compose, CI и общая конфигурация ESLint.
- PostgreSQL — прицелы и атомарный счётчик копирований.
- Redis — защита входа и дедупликация копирований.
- S3-совместимое хранилище — скриншоты.
- Sharp — проверка, очистка и преобразование изображений в WebP.

Express раздаёт готовую сборку из `client/dist` только в production. Во время разработки Vite проксирует
`/api` и `/media` на сервер.

Демонстрационные записи из `server/data/crosshairs.json` импортируются в пустую БД с нулевыми счётчиками.

Каждый прицел содержит код, скриншот, теги, обязательный цвет и необязательный тип. Допустимые цвета:
`red`, `orange`, `yellow`, `green`, `blue`, `indigo`, `violet`, `white`, `black`. Допустимые типы:
`circle`, `dot`, `square`.

## Локальный запуск через Docker

1. Скопируйте `.env.example` в `.env`.
2. Замените все пароли и секреты в `.env`.
3. Запустите:

```bash
docker compose up --build
```

Сайт: `http://localhost:14173`  
Админ-панель: `http://localhost:14173/admin`  
Health-check: `http://localhost:14173/healthz`  
Локальная консоль MinIO: `http://localhost:19001`

## Разработка

Запустите инфраструктуру:

```bash
docker compose up postgres redis minio
```

Затем:

```bash
npm ci
npm run dev
```

Vite работает на `http://localhost:5173`, API — на `http://localhost:4173`.

Запустить части отдельно:

```bash
npm run dev --workspace client
npm run dev --workspace server
```

Собрать только клиент:

```bash
npm run build --workspace client
```

## Production

Используйте управляемые PostgreSQL, Redis и S3/R2. Внешний MinIO из `compose.yaml` предназначен для локального или закрытого окружения.

Обязательные переменные:

- `NODE_ENV=production`
- `HTTPS_ENABLED=true`
- `ADMIN_PASSWORD` — минимум 16 символов
- `SESSION_SECRET` — минимум 32 символа
- `DATABASE_URL`
- `DATABASE_SSL=true` для внешней БД
- `REDIS_URL`
- `S3_ENDPOINT`, `S3_REGION`, `S3_BUCKET`
- `S3_ACCESS_KEY_ID`, `S3_SECRET_ACCESS_KEY`
- `PUBLIC_ORIGIN=https://ваш-домен`
- `TRUST_PROXY=1` за одним доверенным reverse proxy

Приложение завершает запуск при отсутствующей или небезопасной конфигурации.

## Проверки

```bash
npm run check
npm audit --omit=dev
docker compose --env-file .env.example config --quiet
```

CI выполняет линтер, тесты, сборку, аудит production-зависимостей и сборку Docker-образа.

## Эксплуатация

- Настройте HTTPS на балансировщике или reverse proxy.
- Делайте автоматические резервные копии PostgreSQL и S3.
- Подключите сбор структурированных JSON-логов.
- Проверяйте `/healthz` из оркестратора.
- Не публикуйте MinIO, PostgreSQL и Redis напрямую в интернет.
