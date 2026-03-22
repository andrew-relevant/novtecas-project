# Новтекас — Корпоративный сайт

Монорепозиторий проекта: **Next.js 14** (фронтенд) + **Strapi CMS** (бэкенд) + **PostgreSQL** (БД).

## Структура проекта

```
novtecas-project/
├── web/                 # Next.js 14 (App Router)
│   ├── app/             # Страницы и маршруты
│   ├── components/      # UI-компоненты (ShadCN)
│   ├── lib/             # Утилиты (strapi.ts, utils.ts)
│   └── Dockerfile
├── cms/                 # Strapi CMS
│   ├── config/          # Конфигурация Strapi
│   ├── src/api/         # Content Models
│   └── Dockerfile
├── docker-compose.yml
├── .env                 # Переменные окружения
└── .env.example
```

## Быстрый старт

### Требования

- Docker и Docker Compose
- Node.js 20+ (для локальной разработки без Docker)

### Запуск через Docker

```bash
# 1. Скопировать переменные окружения
cp .env.example .env

# 2. Отредактировать секреты в .env (APP_KEYS, JWT_SECRET и т.д.)

# 3. Запустить все сервисы
docker compose up --build
```

После запуска:

| Сервис       | URL                          |
| ------------ | ---------------------------- |
| Next.js      | http://localhost:3000         |
| Strapi Admin | http://localhost:1337/admin   |
| Strapi API   | http://localhost:1337/api     |
| PostgreSQL   | localhost:5432                |

### Первый запуск Strapi

При первом запуске Strapi попросит создать администратора через веб-интерфейс по адресу `http://localhost:1337/admin`.

## Content Models (Strapi)

### Collection Types

| Модель          | API endpoint         | Описание                     |
| --------------- | -------------------- | ---------------------------- |
| Product         | /api/products        | Каталог продукции            |
| MediaItem       | /api/media-items     | Новости и публикации         |
| PortfolioItem   | /api/portfolio-items | Портфолио проектов           |
| Dealer          | /api/dealers         | Официальные дилеры           |
| Document        | /api/documents       | Документы и сертификаты      |

### Single Types

| Модель          | API endpoint              | Описание                 |
| --------------- | ------------------------- | ------------------------ |
| PageAbout       | /api/page-about           | Страница «О компании»    |
| PageProduction  | /api/page-production      | Страница «Производство»  |
| PageBlacklist   | /api/page-blacklist       | Страница «Чёрный список» |
| PageContacts    | /api/page-contacts        | Страница «Контакты»      |
| PageDealers     | /api/page-dealers         | Страница «Дилеры»        |

## Маршруты Next.js

| Путь                       | Описание                    |
| -------------------------- | --------------------------- |
| `/`                        | Главная страница            |
| `/company/about`           | О компании                  |
| `/company/production`      | Производство                |
| `/products`                | Каталог продукции           |
| `/products/[slug]`         | Карточка продукта           |
| `/media`                   | Медиа / Новости             |
| `/media/[slug]`            | Детальная медиа-страница    |
| `/portfolio`               | Портфолио                   |
| `/portfolio/[slug]`        | Детальная страница проекта  |
| `/dealers`                 | Дилеры                      |
| `/documents`               | Документы                   |
| `/contacts`                | Контакты                    |
| `/blacklist`               | Чёрный список               |

## Технологии

- **Next.js 14+** — App Router, RSC, TypeScript
- **ShadCN UI** + **Tailwind CSS** — UI-фреймворк
- **Strapi 4** — Headless CMS
- **PostgreSQL 16** — База данных
- **Docker / Docker Compose** — Контейнеризация
