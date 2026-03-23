# Interactive Markdown Editor

Онлайн Markdown-редактор с живым предпросмотром, экспортом в несколько форматов и SEO-ready production-сборкой для деплоя в Coolify.

## Основные возможности

- Живой предпросмотр Markdown в реальном времени.
- Поддержка GFM (`marked`) + безопасная санитизация (`DOMPurify`).
- Подсветка кода (`highlight.js` + `marked-highlight`).
- Экспорт в `.md`, `.html`, `.pdf`.
- Режимы рабочего пространства: разделение, только превью, фокус.
- Синхронизация скролла между редактором и превью в split-режиме.
- Светлая/тёмная/системная тема (cookie storage).
- Блок статистики и структуры заголовков.
- Информационные UX-блоки с якорной навигацией:
  - `О редакторе`
  - `Преимущества`
  - `Шпаргалка по Markdown`

## Стек

- React 19 + TypeScript
- Vite
- Tailwind CSS + shadcn/ui primitives
- Nginx runtime (через Docker multi-stage)

## Локальная разработка

```bash
npm install
npm run dev
```

Dev URL: `http://localhost:3000`

## Production build

```bash
npm run build
```

Сборка попадает в `dist/`.

## Переменные окружения

Для локального запуска не требуются.

Для контейнерного запуска:

- `SITE_URL` — публичный URL проекта (рекомендуется, например `https://md.example.com`).
- Пример переменной: [`.env.example`](.env.example)

Фолбэк:

- если `SITE_URL` не задан, entrypoint пытается взять `COOLIFY_FQDN`;
- если и его нет, используется `http://localhost`.

## Деплой в Coolify (Dockerfile)

Проект рассчитан на деплой как Dockerfile-сервис.

1. Создать сервис из Git-репозитория.
2. Build Pack: `Dockerfile`.
3. Dockerfile path: `./Dockerfile`.
4. Exposed Port: `80`.
5. Добавить домен в разделе Domains.
6. Задать env: `SITE_URL=https://ваш-домен`.
7. Deploy.

После деплоя проверить:

- `/healthz`
- `/robots.txt`
- `/sitemap.xml`
- `/non-existent-page` (должен открыться кастомный `404` с HTTP-статусом `404`)
- `http://домен/` → редирект на `https://домен/`
- `https://www.домен/` → редирект на `https://домен/`
- `https://домен/index.html` и URL со слешем на конце (`/page/`) → канонические редиректы
- `view-source:` главной страницы (canonical/OG должны содержать ваш домен).

Подробная инструкция: [`docs/DEPLOY_COOLIFY.md`](docs/DEPLOY_COOLIFY.md)

## Что важно перед коммитом

```bash
npm run build
```

Рекомендуется также проверить:

- отсутствие конфликтов в `App.tsx` и `features/editor/components/KnowledgeSections.tsx`;
- актуальность ссылок в верхнем меню (`#section-what-is`, `#section-why-choose`, `#section-cheatsheet`).

## Документация

- Архитектура и модули: [`docs/PROJECT.md`](docs/PROJECT.md)
- Деплой в Coolify: [`docs/DEPLOY_COOLIFY.md`](docs/DEPLOY_COOLIFY.md)
