# Архитектура проекта

## Назначение

`interactive-markdown-editor` — одностраничное React-приложение для подготовки Markdown-документов: ввод, предпросмотр, анализ структуры и экспорт.

## Структура кода

- `App.tsx` — композиция страницы, управление режимами workspace, top-nav, split layout.
- `features/editor/components/MarkdownEditorPane.tsx` — UI-панель редактора.
- `features/editor/components/KnowledgeSections.tsx` — контентные UX/SEO-блоки (включая шпаргалку).
- `features/editor/hooks/useEditorPersistence.ts` — работа с `localStorage`.
- `features/editor/hooks/useExportActions.ts` — экспорт `.md/.html/.pdf`.
- `features/editor/hooks/useThemeMode.ts` — light/dark/system тема (cookie + `prefers-color-scheme`).
- `components/ui/*` — UI primitives в стиле shadcn.
- `index.css` — дизайн-токены и глобальные стили.
- `public/*` — SEO/manifest/robots/sitemap assets.

## Ключевые продуктовые блоки

1. Редактор + предпросмотр с синхронизацией скролла.
2. Режимы работы:
   - `split`
   - `preview`
   - `focus`
3. Экспорт:
   - `.md`
   - `.html`
   - `.pdf` (через `html2pdf.js`)
4. Верхняя якорная навигация:
   - `#section-what-is` (`О редакторе`)
   - `#section-why-choose` (`Преимущества`)
   - `#section-cheatsheet` (`Шпаргалка по Markdown`)

## Состояние и URL

- Markdown-контент: `localStorage` key `interactive-markdown-editor-content-v2`.
- Тема: cookie `markdown-editor-theme`.
- UI state синхронизируется в URL query:
  - `mode=preview|focus`
  - `tab=preview` (на mobile)

## SEO и метаданные

- Базовые meta/OG/Twitter/JSON-LD в `index.html`.
- `canonical`, `og:url`, `og:image` содержат плейсхолдер `__SITE_URL__`, заменяемый на старте контейнера.
- `robots.txt` и `sitemap.xml` генерируются из `*.template`.

## Production-контейнер

- Build: multi-stage `Dockerfile` (`node:20-alpine` → `nginx:1.27-alpine`).
- Runtime config: `docker/nginx.conf`.
- Entrypoint: `docker/entrypoint.sh`.
- Healthcheck endpoint: `/healthz`.

## Локальная проверка перед коммитом

```bash
npm run build
```

Опционально (если доступен Docker daemon):

```bash
docker build -t interactive-markdown-editor:local .
docker run --rm -p 8080:80 -e SITE_URL=https://example.com interactive-markdown-editor:local
```

Проверить:

- `http://localhost:8080/healthz`
- `http://localhost:8080/robots.txt`
- `http://localhost:8080/sitemap.xml`
