# Деплой в Coolify

## Что уже подготовлено в проекте

- `Dockerfile` с multi-stage build (Node build + Nginx runtime).
- Production-конфиг Nginx с:
  - SPA fallback,
  - кэшем статических ассетов,
  - security headers,
  - healthcheck endpoint `/healthz`.
- Startup-скрипт контейнера:
  - подставляет `SITE_URL` в `index.html`,
  - генерирует `robots.txt` и `sitemap.xml` из шаблонов.

## Настройка сервиса в Coolify

1. Source: GitHub repo.
2. Build Pack: `Dockerfile`.
3. Port: `80`.
4. Domain: укажи в разделе Domains.
5. Environment Variables:
   - `SITE_URL=https://твой-домен`

## Проверка после деплоя

Открой:

- `https://твой-домен/healthz`
- `https://твой-домен/robots.txt`
- `https://твой-домен/sitemap.xml`

Проверь canonical и OG в HTML:

- `view-source:https://твой-домен/`

## Важные замечания

- Если `SITE_URL` не задан, контейнер попробует использовать `COOLIFY_FQDN`.
- Для предсказуемого SEO лучше всегда явно задавать `SITE_URL`.
