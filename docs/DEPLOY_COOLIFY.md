# Деплой в Coolify

## Что уже готово в проекте

- Multi-stage `Dockerfile`:
  - stage build: `node:20-alpine` (`npm ci` + `npm run build`)
  - stage runtime: `nginx:1.27-alpine`
- `docker/nginx.conf`:
  - корректная отдача `404` для неизвестных URL через `error_page`
  - cache headers для `/assets/*`
  - security headers
  - health endpoint `/healthz`
- `docker/entrypoint.sh`:
  - подставляет `__SITE_URL__` в HTML
  - генерирует `robots.txt` и `sitemap.xml` из шаблонов

## Настройка сервиса в Coolify

1. **Create Resource** → **Application** → подключите Git-репозиторий.
2. **Build Pack**: `Dockerfile`.
3. **Dockerfile Location**: `./Dockerfile`.
4. **Port Exposes**: `80`.
5. Добавьте домен в **Domains**.
6. В **Environment Variables** добавьте:
   - `SITE_URL=https://ваш-домен`

Рекомендуется всегда задавать `SITE_URL` явно для корректных canonical/OG/sitemap.

## Что будет, если SITE_URL не задан

Entrypoint fallback:

1. Берёт `COOLIFY_FQDN` (первый домен из списка).
2. Если его нет — использует `http://localhost`.

## Пост-деплой проверка (обязательно)

Проверьте вручную:

- `https://ваш-домен/healthz` → `200 ok`
- `https://ваш-домен/robots.txt` → содержит `Sitemap: https://ваш-домен/sitemap.xml`
- `https://ваш-домен/sitemap.xml` → `<loc>https://ваш-домен/</loc>`
- `https://ваш-домен/non-existent-page` → открывается кастомная `404` страница и возвращается HTTP `404`
- `http://ваш-домен/` → `308` на `https://ваш-домен/`
- `https://www.ваш-домен/` → `308` на `https://ваш-домен/`
- `https://ваш-домен/index.html` → `308` на `https://ваш-домен/`
- `https://ваш-домен/any-page/` → `308` на `https://ваш-домен/any-page`

Проверка source:

- `view-source:https://ваш-домен/`
- убедиться, что `canonical`, `og:url`, `og:image` больше не содержат `__SITE_URL__`

## Локальная проверка контейнера (до деплоя)

Требуется запущенный Docker daemon.

```bash
docker build -t interactive-markdown-editor:local .
docker run --rm -p 8080:80 -e SITE_URL=https://example.com interactive-markdown-editor:local
```

Далее проверить:

- `http://localhost:8080/healthz`
- `http://localhost:8080/robots.txt`
- `http://localhost:8080/sitemap.xml`

Проверка редиректов локально (эмуляция reverse proxy заголовков):

```bash
curl -I -H "X-Forwarded-Proto: http" http://localhost:8080/
curl -I -H "Host: www.example.com" http://localhost:8080/
curl -I http://localhost:8080/index.html
curl -I http://localhost:8080/docs/
```

## Типовые проблемы

- **Контейнер не стартует в Coolify**:
  - убедитесь, что выбран Build Pack `Dockerfile`, а не Nixpacks.
- **Неверные canonical/OG ссылки**:
  - проверьте, что `SITE_URL` задан без лишних пробелов.
- **`__SITE_URL__` остался в HTML**:
  - контейнер стартовал без выполнения entrypoint (проверить image/command overrides в Coolify).
