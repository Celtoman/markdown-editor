<div align="center">
  <img width="1200" height="475" alt="Interactive Markdown Editor Banner" src="https://github.com/user-attachments/assets/0aa67016-6eaf-458a-adb2-6e31a0763ed6" />

  <h1>Interactive Markdown Editor</h1>
  <p>
    Современный редактор Markdown с живым предпросмотром, статистикой документа
    и удобным интерфейсом «редактор + превью».
  </p>

  <p>
    <a href="https://ai.studio/apps/drive/1RbrW4CdMgFR-Y3VOtls2vigrsmNmH8wV">Демо в AI Studio</a>
  </p>
</div>

## Что умеет

- Живой предпросмотр Markdown в реальном времени.
- Поддержка GFM через `marked` (таблицы, списки, код-блоки и т.д.).
- Изменяемая ширина панелей редактора и предпросмотра.
- Полноэкранный режим предпросмотра.
- Копирование результата в буфер (HTML + plain text, с fallback).
- Статистика текста: слова, символы, заголовки H1-H6.
- Авто-оглавление по заголовкам документа.

## Быстрый старт

### Требования

- Node.js 18+ (рекомендуется LTS)
- npm

### Установка и запуск

1. Установить зависимости:

```bash
npm install
```

2. Создать `.env.local` (если еще не создан) и добавить ключ:

```bash
GEMINI_API_KEY=your_api_key_here
```

3. Запустить dev-сервер:

```bash
npm run dev
```

4. Открыть в браузере:

```text
http://localhost:3000
```

## Скрипты

| Скрипт | Назначение |
| --- | --- |
| `npm run dev` | Запуск проекта в режиме разработки |
| `npm run build` | Production-сборка в папку `dist/` |
| `npm run preview` | Локальный предпросмотр production-сборки |

## Стек

- React 19
- TypeScript
- Vite
- Marked (парсинг Markdown)
- Tailwind CSS (через CDN в `index.html`)

## Структура проекта

```text
interactive-markdown-editor/
  App.tsx
  index.tsx
  index.html
  vite.config.ts
  package.json
  public/
    robots.txt
```

## Переменные окружения

| Переменная | Описание |
| --- | --- |
| `GEMINI_API_KEY` | API-ключ Gemini (передается через Vite define) |

## Полезные заметки

- Основная логика интерфейса находится в `App.tsx`.
- По умолчанию dev-сервер настроен на порт `3000` в `vite.config.ts`.
- В проекте нет тестов и линтера из коробки.

## Планы по развитию

- Добавить санитизацию HTML для предпросмотра.
- Добавить `eslint` и базовые тесты.
- Добавить экспорт в `.md` / `.html`.

## Вклад в проект

PR и улучшения приветствуются. Перед отправкой изменений рекомендуется:

1. Проверить локальный запуск `npm run dev`.
2. Проверить сборку `npm run build`.
3. Описать изменения в PR максимально конкретно.

## Лицензия

Лицензия пока не указана.
