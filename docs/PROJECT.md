# Документация проекта

## Назначение

`interactive-markdown-editor` — клиентское React-приложение для написания Markdown с мгновенным предпросмотром и экспортом.

## Архитектура

- Основная логика расположена в `App.tsx`.
- UI-компоненты в `components/ui` (shadcn-style primitives).
- Утилиты в `lib/utils.ts`.
- Стили в `index.css` (Tailwind + переменные тем).

## Ключевые модули

- Рендер Markdown: `marked`.
- Санитизация HTML: `DOMPurify`.
- Подсветка кода: `highlight.js` + `marked-highlight`.
- Экспорт PDF: `html2pdf.js`.

## Темизация

- Поддерживаются режимы: `light`, `dark`, `system`.
- Режим темы хранится в cookie `markdown-editor-theme`.
- На корневой элемент `html` добавляется/снимается класс `dark`.

## Состояние редактора

- Контент сохраняется в `localStorage` (`interactive-markdown-editor-content-v2`).
- На desktop доступно изменение ширины панелей.
- Реализована синхронизация прокрутки редактора и предпросмотра в режиме split.

## Экспорт

- `.md`: сохраняет исходный markdown.
- `.html`: генерирует самостоятельный HTML-документ.
- `.pdf`: генерирует PDF из HTML-предпросмотра.

## Переменные окружения

- Локальная разработка: переменные окружения не требуются.
- Production-контейнер: рекомендуется `SITE_URL` для корректных canonical/OG/sitemap.

## Production и деплой

- Для деплоя в Coolify используется `Dockerfile`.
- Runtime: `nginx:alpine`.
- Healthcheck: `/healthz`.
- SEO-шаблоны `robots.txt` и `sitemap.xml` заполняются доменом на старте контейнера.

## Локальная разработка

```bash
npm install
npm run dev
```

Сборка:

```bash
npm run build
```
