import type { LucideIcon } from "lucide-react";
import {
  ArrowRight,
  BookOpenText,
  Bot,
  CheckCircle2,
  Code2,
  FileOutput,
  Layers3,
  Link2,
  ListChecks,
  LockKeyhole,
  Quote,
  Rocket,
  ShieldCheck,
  Sparkles,
  Table2,
  Type,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

const impactMetrics = [
  { label: "Формата экспорта", value: "3" },
  { label: "Лишних экранов", value: "0" },
  { label: "Быстрых сценария", value: "4" },
] as const;

const valueHighlights = [
  "Редактируете и сразу видите итоговый вид документа",
  "Экспортируете в .md, .html или .pdf без сторонних сервисов",
  "Работаете в одном экране, без лишних шагов и переключений",
] as const;

const coreBenefits: ReadonlyArray<{
  icon: LucideIcon;
  title: string;
  description: string;
}> = [
  {
    icon: Sparkles,
    title: "Сразу понятный результат",
    description:
      "Вы видите финальное форматирование по мере ввода и быстрее доводите текст до публикации.",
  },
  {
    icon: FileOutput,
    title: "Экспорт без рутины",
    description:
      "Готовый файл скачивается в нужном формате за один клик, без ручной конвертации.",
  },
  {
    icon: Code2,
    title: "Подходит для рабочих текстов",
    description:
      "Удобно писать документацию, инструкции, статьи и технические заметки.",
  },
  {
    icon: Bot,
    title: "Меньше отвлечений",
    description:
      "Интерфейс сфокусирован на письме и структуре, а не на сложных настройках.",
  },
  {
    icon: LockKeyhole,
    title: "Стабильный рабочий поток",
    description:
      "Черновик, проверка и финальный файл находятся в одной логичной последовательности.",
  },
  {
    icon: Rocket,
    title: "Быстрый старт",
    description:
      "Открываете страницу и начинаете писать сразу, без онбординга и лишней подготовки.",
  },
] as const;

const usageSteps = [
  {
    step: "1",
    title: "Наберите черновик",
    description:
      "Вставьте заметки или начните с чистого листа, чтобы собрать основу текста.",
  },
  {
    step: "2",
    title: "Сверьте структуру",
    description:
      "Проверьте заголовки, списки, цитаты и код в превью прямо во время редактирования.",
  },
  {
    step: "3",
    title: "Доведите до финала",
    description:
      "Уберите лишнее, усилите формулировки и убедитесь, что документ читается легко.",
  },
  {
    step: "4",
    title: "Сохраните в нужный формат",
    description:
      "Экспортируйте в .md, .html или .pdf и сразу отправляйте в работу.",
  },
] as const;

const cheatBasics: ReadonlyArray<{
  icon: LucideIcon;
  title: string;
  syntax: string;
  tip: string;
}> = [
  {
    icon: Type,
    title: "Заголовок",
    syntax: "# Заголовок раздела",
    tip: "Главная мысль текущего блока.",
  },
  {
    icon: Type,
    title: "Подзаголовок",
    syntax: "## Подраздел",
    tip: "Удобно делить текст на короткие части.",
  },
  {
    icon: Sparkles,
    title: "Акцент в тексте",
    syntax: "**Важно** и *уточнение*",
    tip: "Подсветите ключевую мысль без перегруза.",
  },
  {
    icon: ListChecks,
    title: "Список",
    syntax: "- Пункт\n- Ещё пункт",
    tip: "Для задач, тезисов и чек-листов.",
  },
  {
    icon: Quote,
    title: "Цитата",
    syntax: "> Важная мысль или комментарий",
    tip: "Для выделения вывода или примечания.",
  },
  {
    icon: Link2,
    title: "Ссылка",
    syntax: "[Текст ссылки](https://example.com)",
    tip: "Добавляйте источники и переходы.",
  },
  {
    icon: Code2,
    title: "Блок кода",
    syntax: "```ts\nconst answer = 42;\n```",
    tip: "Для примеров с подсветкой синтаксиса.",
  },
  {
    icon: Table2,
    title: "Таблица",
    syntax: "| Поле | Значение |\n| --- | --- |",
    tip: "Для сравнений и компактных данных.",
  },
] as const;

const cheatTemplates = [
  {
    title: "Шаблон короткой заметки",
    syntax:
      "## Итог дня\n\n- Что сделано\n- Что осталось\n- Следующий шаг",
  },
  {
    title: "Шаблон мини-инструкции",
    syntax:
      "## Как сделать задачу\n\n1. Подготовьте данные\n2. Выполните шаги\n3. Проверьте результат",
  },
  {
    title: "Шаблон техблока",
    syntax:
      "## API пример\n\n```bash\ncurl -X GET https://api.example.com\n```",
  },
] as const;

const exportChecklist = [
  "Заголовки идут в логичном порядке (H1 → H2 → H3)",
  "Списки и таблицы выглядят аккуратно в превью",
  "Код-блоки подписаны языком, если это важно",
  "Ссылки читаемые и ведут по нужному адресу",
] as const;

const trustCards = [
  {
    title: "Понятный процесс",
    description:
      "Вы всегда понимаете, на каком этапе находитесь: черновик, проверка, экспорт.",
  },
  {
    title: "Предсказуемый результат",
    description:
      "То, что вы видите в превью, совпадает с тем, что получите в финальном файле.",
  },
  {
    title: "Практическая польза",
    description:
      "Редактор помогает быстрее выпускать рабочие документы, а не тратить время на оформление.",
  },
] as const;

const sectionCardClass = "glass-surface rounded-3xl scroll-mt-24";

export const KnowledgeSections = () => {
  return (
    <section
      className="space-y-6 md:space-y-8"
      aria-label="Информационные блоки о Markdown-редакторе"
    >
      <Card id="section-what-is" className={sectionCardClass}>
        <CardHeader>
          <CardTitle className="text-balance text-2xl md:text-3xl">
            Что это за редактор и зачем он вам
          </CardTitle>
          <CardDescription className="max-w-3xl text-sm md:text-base">
            markdown-editor.pro помогает пройти весь путь в одном месте:
            написать, проверить, структурировать и экспортировать документ без
            разрывов в процессе.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 lg:grid-cols-[1.2fr_0.8fr]">
            <div className="rounded-2xl border bg-background/55 p-4 md:p-5">
              <h3 className="text-base font-semibold md:text-lg">
                Что вы получите в работе
              </h3>
              <div className="mt-4 grid gap-2 sm:grid-cols-3">
                {impactMetrics.map((metric) => (
                  <article
                    key={metric.label}
                    className="rounded-xl border bg-background px-3 py-3"
                  >
                    <p className="text-2xl font-semibold leading-none">
                      {metric.value}
                    </p>
                    <p className="mt-1 text-xs text-muted-foreground">
                      {metric.label}
                    </p>
                  </article>
                ))}
              </div>
            </div>

            <aside className="rounded-2xl border bg-background/55 p-4 md:p-5">
              <div className="mb-3 flex items-center gap-2">
                <div className="rounded-lg bg-primary/12 p-2 text-primary">
                  <Layers3 className="h-4 w-4" />
                </div>
                <p className="text-sm font-semibold">Ключевые преимущества</p>
              </div>
              <div className="space-y-2.5">
                {valueHighlights.map((item) => (
                  <div key={item} className="flex items-start gap-2">
                    <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                    <p className="text-sm text-foreground/90">{item}</p>
                  </div>
                ))}
              </div>
            </aside>
          </div>
        </CardContent>
      </Card>

      <Card id="section-why-choose" className={sectionCardClass}>
        <CardHeader>
          <CardTitle className="text-balance text-2xl md:text-3xl">
            Почему с ним проще писать каждый день
          </CardTitle>
          <CardDescription className="max-w-3xl text-sm md:text-base">
            Здесь собраны не абстрактные обещания, а реальные причины, почему
            редактор экономит время и снижает количество правок.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
            {coreBenefits.map((benefit) => {
              const Icon = benefit.icon;
              return (
                <article
                  key={benefit.title}
                  className="rounded-2xl border bg-background/55 p-4 transition-colors duration-200 hover:bg-background"
                >
                  <div className="flex items-center gap-2">
                    <div className="rounded-lg bg-primary/12 p-2 text-primary">
                      <Icon className="h-4 w-4" />
                    </div>
                    <h3 className="text-sm font-semibold">{benefit.title}</h3>
                  </div>
                  <p className="mt-3 text-sm text-muted-foreground">
                    {benefit.description}
                  </p>
                </article>
              );
            })}
          </div>
        </CardContent>
      </Card>

      <Card id="section-how-to-use" className={sectionCardClass}>
        <CardHeader>
          <CardTitle className="text-balance text-2xl md:text-3xl">
            Как начать за одну минуту
          </CardTitle>
          <CardDescription className="max-w-3xl text-sm md:text-base">
            Быстрый сценарий для старта: от черновика до готового файла в четыре
            простых шага.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
            {usageSteps.map((step, index) => (
              <article
                key={step.step}
                className="rounded-2xl border bg-background/55 p-4"
              >
                <div className="flex items-center justify-between">
                  <span className="inline-flex h-7 min-w-7 items-center justify-center rounded-full bg-primary/15 px-2 text-sm font-semibold text-primary">
                    {step.step}
                  </span>
                  {index < usageSteps.length - 1 ? (
                    <ArrowRight className="hidden h-4 w-4 text-muted-foreground xl:block" />
                  ) : null}
                </div>
                <h3 className="mt-3 text-sm font-semibold">{step.title}</h3>
                <p className="mt-2 text-sm text-muted-foreground">
                  {step.description}
                </p>
              </article>
            ))}
          </div>
        </CardContent>
      </Card>

      <Card id="section-cheatsheet" className={sectionCardClass}>
        <CardHeader>
          <CardTitle className="text-balance text-2xl md:text-3xl">
            Шпаргалка по Markdown
          </CardTitle>
          <CardDescription className="max-w-3xl text-sm md:text-base">
            Вместо “академического” справочника здесь собраны конструкции,
            которыми пользуются каждый день: быстро, понятно и с примерами.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 lg:grid-cols-[1.1fr_0.9fr]">
            <section className="rounded-2xl border bg-background/55 p-4 md:p-5">
              <h3 className="text-base font-semibold md:text-lg">
                Базовые конструкции
              </h3>
              <p className="mt-1 text-sm text-muted-foreground">
                Сохраните этот блок в закладки: его достаточно для 90% задач.
              </p>
              <div className="mt-4 grid gap-3 sm:grid-cols-2">
                {cheatBasics.map((item) => {
                  const Icon = item.icon;
                  return (
                    <article
                      key={item.title}
                      className="rounded-xl border bg-background p-3"
                    >
                      <div className="flex items-center gap-2">
                        <div className="rounded-md bg-primary/12 p-1.5 text-primary">
                          <Icon className="h-4 w-4" />
                        </div>
                        <p className="text-sm font-semibold">{item.title}</p>
                      </div>
                      <pre className="mt-2 overflow-x-auto rounded-md border bg-muted/60 px-2.5 py-2 text-xs leading-5">
                        <code>{item.syntax}</code>
                      </pre>
                      <p className="mt-2 text-xs text-muted-foreground">
                        {item.tip}
                      </p>
                    </article>
                  );
                })}
              </div>
            </section>

            <div className="space-y-4">
              <section className="rounded-2xl border bg-background/55 p-4 md:p-5">
                <h3 className="text-base font-semibold md:text-lg">
                  Готовые шаблоны
                </h3>
                <div className="mt-3 space-y-3">
                  {cheatTemplates.map((item) => (
                    <article key={item.title} className="rounded-xl border bg-background p-3">
                      <p className="text-sm font-semibold">{item.title}</p>
                      <pre className="mt-2 overflow-x-auto rounded-md border bg-muted/60 px-2.5 py-2 text-xs leading-5">
                        <code>{item.syntax}</code>
                      </pre>
                    </article>
                  ))}
                </div>
              </section>

              <section className="rounded-2xl border bg-background/55 p-4 md:p-5">
                <h3 className="text-base font-semibold md:text-lg">
                  Что проверить перед экспортом
                </h3>
                <div className="mt-3 space-y-2.5">
                  {exportChecklist.map((item) => (
                    <div key={item} className="flex items-start gap-2">
                      <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                      <p className="text-sm text-foreground/90">{item}</p>
                    </div>
                  ))}
                </div>
              </section>
            </div>
          </div>

          <div className="flex flex-wrap gap-2">
            <Button asChild variant="outline">
              <a href="#main-content">
                <BookOpenText className="mr-2 h-4 w-4" />
                Проверить в редакторе
              </a>
            </Button>
            <Button asChild variant="ghost">
              <a href="#section-how-to-use">
                <ArrowRight className="mr-2 h-4 w-4" />
                Вернуться к шагам
              </a>
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card id="section-trust" className={sectionCardClass}>
        <CardHeader>
          <CardTitle className="text-balance text-2xl md:text-3xl">
            Почему результату можно доверять
          </CardTitle>
          <CardDescription className="max-w-3xl text-sm md:text-base">
            Редактор строит работу так, чтобы вы получали предсказуемый результат
            без хаоса в процессе.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-3 md:grid-cols-3">
            {trustCards.map((card) => (
              <article key={card.title} className="rounded-2xl border bg-background/55 p-4">
                <div className="flex items-center gap-2">
                  <div className="rounded-lg bg-primary/12 p-2 text-primary">
                    <ShieldCheck className="h-4 w-4" />
                  </div>
                  <p className="text-sm font-semibold">{card.title}</p>
                </div>
                <p className="mt-3 text-sm text-muted-foreground">
                  {card.description}
                </p>
              </article>
            ))}
          </div>
        </CardContent>
      </Card>

      <Card id="section-final-cta" className={sectionCardClass}>
        <CardContent className="p-6 md:p-8">
          <div className="flex flex-col gap-5 md:flex-row md:items-end md:justify-between">
            <div className="max-w-3xl space-y-3">
              <h2 className="text-balance text-2xl font-semibold tracking-tight md:text-3xl">
                Готовы создать документ?
              </h2>
              <p className="text-sm text-muted-foreground md:text-base">
                Откройте редактор, внесите текст и получите готовый файл в
                удобном формате уже через пару минут.
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <Button asChild size="sm">
                <a href="#main-content">
                  <ArrowRight className="h-4 w-4" />
                  Открыть редактор
                </a>
              </Button>
              <Button asChild variant="outline" size="sm">
                <a href="#section-cheatsheet">
                  <BookOpenText className="h-4 w-4" />
                  Открыть шпаргалку
                </a>
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </section>
  );
};
