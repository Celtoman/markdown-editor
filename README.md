# Interactive Markdown Editor

Онлайн Markdown-редактор с живым предпросмотром, экспортом и адаптивным интерфейсом.

## Что умеет

- Живой предпросмотр Markdown в реальном времени.
- Поддержка GFM (`marked`) и санитизация HTML (`DOMPurify`).
- Подсветка кода (`highlight.js` + `marked-highlight`).
- Экспорт в `.md`, `.html`, `.pdf`.
- Режимы: разделение, только предпросмотр, фокус.
- Темы: светлая, темная, системная (сохранение в cookie).
- Статистика текста + структура заголовков.

## Технологии

- React 19
- TypeScript
- Vite
- Tailwind CSS + shadcn/ui
- Nginx (production-контейнер)

## Локальный запуск

```bash
npm install
npm run dev
```

По умолчанию: `http://localhost:3000`

## Переменные окружения

Для локальной разработки переменные окружения не требуются.

Для production-контейнера:

- `SITE_URL` (рекомендуется) — публичный URL сайта, например `https://md.example.com`.
- Пример: `.env.example`.

Если `SITE_URL` не задан, контейнер пытается использовать `COOLIFY_FQDN` (если переменная доступна в окружении Coolify).

## Деплой на Coolify

Проект подготовлен для деплоя через `Dockerfile`.

1. Создай новый сервис в Coolify из GitHub-репозитория.
2. Тип билда: `Dockerfile`.
3. Порт: `80`.
4. Добавь домен в настройках Coolify.
5. Добавь env `SITE_URL=https://твой-домен`.
6. Нажми Deploy.

Healthcheck endpoint:

- `/healthz`

## SEO-ready что уже сделано

- Meta title/description/keywords.
- `robots` meta + `theme-color`.
- Canonical URL.
- Open Graph + Twitter meta.
- Schema.org (`WebApplication`) в `index.html`.
- SEO-страницы:
  - `/markdown-to-pdf/`
  - `/markdown-to-html/`
  - `/markdown-syntax-guide/`
- FAQ/HowTo schema для SEO-страниц.
- `robots.txt` и `sitemap.xml` генерируются с корректным доменом при старте контейнера.
- `site.webmanifest`, favicon и OG image.

## Нужна ли мини-админка для SEO

На текущем этапе не обязательна: базовое SEO уже покрыто.

Мини-админка понадобится, если ты хочешь без релиза менять:

- title/description,
- og:image,
- robots/sitemap-правила,
- JSON-LD/контентные SEO-блоки.

## Документация

- Архитектура проекта: [`docs/PROJECT.md`](docs/PROJECT.md)
- Деплой в Coolify: [`docs/DEPLOY_COOLIFY.md`](docs/DEPLOY_COOLIFY.md)

## Проверка перед push

```bash
npm run build
```
