import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import DOMPurify from "dompurify";
import { marked } from "marked";
import hljs from "highlight.js/lib/core";
import bash from "highlight.js/lib/languages/bash";
import css from "highlight.js/lib/languages/css";
import javascript from "highlight.js/lib/languages/javascript";
import json from "highlight.js/lib/languages/json";
import markdownLang from "highlight.js/lib/languages/markdown";
import plaintext from "highlight.js/lib/languages/plaintext";
import python from "highlight.js/lib/languages/python";
import sql from "highlight.js/lib/languages/sql";
import typescript from "highlight.js/lib/languages/typescript";
import xml from "highlight.js/lib/languages/xml";
import { markedHighlight } from "marked-highlight";
import {
  Columns2,
  ClipboardCheck,
  Copy,
  Download,
  Eye,
  Expand,
  FileCode2,
  FileText,
  Focus,
  Menu,
  Monitor,
  Moon,
  Minimize,
  Sun,
  Type,
  X,
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { KnowledgeSections } from "@/features/editor/components/KnowledgeSections";
import { MarkdownEditorPane } from "@/features/editor/components/MarkdownEditorPane";
import { useEditorPersistence } from "@/features/editor/hooks/useEditorPersistence";
import { useExportActions } from "@/features/editor/hooks/useExportActions";
import { type ThemeMode, useThemeMode } from "@/features/editor/hooks/useThemeMode";

const STORAGE_KEY = "interactive-markdown-editor-content-v2";
const MARKED_CONFIGURED_FLAG = "__interactive_markdown_marked_configured__";

hljs.registerLanguage("plaintext", plaintext);
hljs.registerLanguage("text", plaintext);
hljs.registerLanguage("bash", bash);
hljs.registerLanguage("sh", bash);
hljs.registerLanguage("shell", bash);
hljs.registerLanguage("css", css);
hljs.registerLanguage("js", javascript);
hljs.registerLanguage("javascript", javascript);
hljs.registerLanguage("json", json);
hljs.registerLanguage("md", markdownLang);
hljs.registerLanguage("markdown", markdownLang);
hljs.registerLanguage("py", python);
hljs.registerLanguage("python", python);
hljs.registerLanguage("sql", sql);
hljs.registerLanguage("ts", typescript);
hljs.registerLanguage("typescript", typescript);
hljs.registerLanguage("html", xml);
hljs.registerLanguage("xml", xml);

if (!(globalThis as Record<string, unknown>)[MARKED_CONFIGURED_FLAG]) {
  marked.use(
    markedHighlight({
      langPrefix: "hljs language-",
      emptyLangClass: "hljs",
      highlight(code, lang) {
        if (lang && hljs.getLanguage(lang)) {
          return hljs.highlight(code, { language: lang }).value;
        }
        return hljs.highlightAuto(code).value;
      },
    }),
  );
  (globalThis as Record<string, unknown>)[MARKED_CONFIGURED_FLAG] = true;
}

const initialMarkdown = `## Добро пожаловать в Markdown Редактор!

Это живой предпросмотр вашего Markdown текста.

## Основные возможности

- **Жирный текст** и *курсив*.
- Списки:
  1. Нумерованные списки
  2. С несколькими элементами
- \`встроенный код\` для коротких фрагментов.

### Блоки кода

\`\`\`javascript
function greet(name) {
  console.log("Привет, " + name + "!");
}
greet("Мир");
\`\`\`

> Цитаты отлично подходят для выделения важной информации.
`;

type MobileTab = "editor" | "preview";
type WorkspaceMode = "split" | "preview" | "focus";
const isThemeMode = (value: string): value is ThemeMode =>
  value === "light" || value === "dark" || value === "system";
const isMobileTab = (value: string): value is MobileTab =>
  value === "editor" || value === "preview";
const isWorkspaceMode = (value: string): value is WorkspaceMode =>
  value === "split" || value === "preview" || value === "focus";

function App() {
  const [markdown, setMarkdown] = useEditorPersistence(
    STORAGE_KEY,
    initialMarkdown,
  );
  const [isCopied, setIsCopied] = useState<boolean>(false);
  const [editorWidth, setEditorWidth] = useState(48);
  const [isResizing, setIsResizing] = useState(false);
  const [isPreviewFullscreen, setIsPreviewFullscreen] = useState(false);
  const [mobileTab, setMobileTab] = useState<MobileTab>(() => {
    if (typeof window === "undefined") return "editor";
    const urlTab = new URLSearchParams(window.location.search).get("tab");
    return urlTab && isMobileTab(urlTab) ? urlTab : "editor";
  });
  const [workspaceMode, setWorkspaceMode] = useState<WorkspaceMode>(() => {
    if (typeof window === "undefined") return "split";
    const urlMode = new URLSearchParams(window.location.search).get("mode");
    return urlMode && isWorkspaceMode(urlMode) ? urlMode : "split";
  });
  const [isTopMenuOpen, setIsTopMenuOpen] = useState(false);
  const [themeMode, setThemeMode] = useThemeMode();
  const [isDesktop, setIsDesktop] = useState<boolean>(() => {
    if (typeof window === "undefined") return true;
    return window.matchMedia("(min-width: 1024px)").matches;
  });

  const editorPreviewContainerRef = useRef<HTMLDivElement>(null);
  const editorTextareaRef = useRef<HTMLTextAreaElement>(null);
  const previewScrollRef = useRef<HTMLDivElement>(null);
  const scrollSyncSourceRef = useRef<"editor" | "preview" | null>(null);
  const scrollSyncRafRef = useRef<number | null>(null);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const mediaQuery = window.matchMedia("(min-width: 1024px)");
    const syncScreenMode = () => setIsDesktop(mediaQuery.matches);

    syncScreenMode();
    mediaQuery.addEventListener("change", syncScreenMode);
    return () => mediaQuery.removeEventListener("change", syncScreenMode);
  }, []);

  useEffect(() => {
    if (!isDesktop) {
      setIsResizing(false);
    }
  }, [isDesktop]);

  useEffect(() => {
    if (isDesktop) {
      setIsTopMenuOpen(false);
    }
  }, [isDesktop]);

  useEffect(() => {
    if (typeof window === "undefined") return;

    const handlePopState = () => {
      const params = new URLSearchParams(window.location.search);
      const urlTab = params.get("tab");
      const urlMode = params.get("mode");
      setMobileTab(urlTab && isMobileTab(urlTab) ? urlTab : "editor");
      setWorkspaceMode(urlMode && isWorkspaceMode(urlMode) ? urlMode : "split");
    };

    window.addEventListener("popstate", handlePopState);
    return () => window.removeEventListener("popstate", handlePopState);
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") return;

    const currentUrl = new URL(window.location.href);
    if (workspaceMode === "split") {
      currentUrl.searchParams.delete("mode");
    } else {
      currentUrl.searchParams.set("mode", workspaceMode);
    }

    if (mobileTab === "editor") {
      currentUrl.searchParams.delete("tab");
    } else {
      currentUrl.searchParams.set("tab", mobileTab);
    }

    const nextSearch = currentUrl.searchParams.toString();
    const normalizedSearch = nextSearch ? `?${nextSearch}` : "";

    if (normalizedSearch !== window.location.search) {
      window.history.replaceState(
        window.history.state,
        "",
        `${currentUrl.pathname}${normalizedSearch}${currentUrl.hash}`,
      );
    }
  }, [mobileTab, workspaceMode]);

  const renderedHtml = useMemo(() => {
    const processedText = markdown.replace(/^(#{1,6})\s*H[1-6]:\s*/gm, "$1 ");
    const unsafeHtml = marked.parse(processedText, { gfm: true, breaks: true });
    return DOMPurify.sanitize(unsafeHtml as string, {
      USE_PROFILES: { html: true },
    });
  }, [markdown]);

  const plainText = useMemo(() => {
    if (typeof window === "undefined") return "";
    const tempDiv = document.createElement("div");
    tempDiv.innerHTML = renderedHtml;
    return tempDiv.textContent || tempDiv.innerText || "";
  }, [renderedHtml]);

  const stats = useMemo(() => {
    const words =
      plainText.trim() === ""
        ? 0
        : plainText.trim().split(/\s+/).filter(Boolean).length;
    const charsWithSpaces = plainText.length;
    const charsWithoutSpaces = plainText.replace(/\s/g, "").length;

    const headerCounts: Record<
      "h1" | "h2" | "h3" | "h4" | "h5" | "h6",
      number
    > = {
      h1: 0,
      h2: 0,
      h3: 0,
      h4: 0,
      h5: 0,
      h6: 0,
    };
    const headerMatches = markdown.match(/^#{1,6}\s/gm);
    if (headerMatches) {
      headerMatches.forEach((match) => {
        const level = match.trim().length;
        if (level >= 1 && level <= 6) {
          headerCounts[`h${level}` as keyof typeof headerCounts] += 1;
        }
      });
    }

    const headingsTotal = Object.values(headerCounts).reduce(
      (sum, count) => sum + count,
      0,
    );
    return {
      words,
      charsWithSpaces,
      charsWithoutSpaces,
      headerCounts,
      headingsTotal,
    };
  }, [markdown, plainText]);

  const headingLevelCounts = useMemo(
    () => [
      { level: "H1", count: stats.headerCounts.h1 },
      { level: "H2", count: stats.headerCounts.h2 },
      { level: "H3", count: stats.headerCounts.h3 },
      { level: "H4", count: stats.headerCounts.h4 },
    ],
    [
      stats.headerCounts.h1,
      stats.headerCounts.h2,
      stats.headerCounts.h3,
      stats.headerCounts.h4,
    ],
  );

  const outline = useMemo(() => {
    const headers: { level: number; text: string }[] = [];
    const headerRegex = /^(#{1,6})\s*(.*)/;

    markdown.split("\n").forEach((line) => {
      const match = line.match(headerRegex);
      if (!match) return;
      const level = match[1].length;
      const text = match[2].replace(/H[1-6]:\s*/, "").trim();
      if (text) headers.push({ level, text });
    });

    return headers;
  }, [markdown]);

  const handleCopy = () => {
    if (isCopied) return;
    try {
      const htmlBlob = new Blob([renderedHtml], { type: "text/html" });
      const textBlob = new Blob([plainText], { type: "text/plain" });
      const clipboardItem = new ClipboardItem({
        "text/html": htmlBlob,
        "text/plain": textBlob,
      });

      navigator.clipboard
        .write([clipboardItem])
        .then(() => {
          setIsCopied(true);
          setTimeout(() => setIsCopied(false), 1800);
        })
        .catch(() => {
          navigator.clipboard.writeText(plainText).then(() => {
            setIsCopied(true);
            setTimeout(() => setIsCopied(false), 1800);
          });
        });
    } catch {
      navigator.clipboard.writeText(plainText).then(() => {
        setIsCopied(true);
        setTimeout(() => setIsCopied(false), 1800);
      });
    }
  };

  const { isExportingPdf, handleExportMarkdown, handleExportHtml, handleExportPdf } =
    useExportActions({ markdown, renderedHtml });

  const handleMouseDown = (e: React.MouseEvent) => {
    if (!isDesktop) return;
    e.preventDefault();
    setIsResizing(true);
  };

  const handleMouseUp = useCallback(() => setIsResizing(false), []);

  const handleMouseMove = useCallback(
    (e: MouseEvent) => {
      if (!isDesktop || !isResizing || !editorPreviewContainerRef.current)
        return;
      const container = editorPreviewContainerRef.current;
      const rect = container.getBoundingClientRect();
      const newWidthPercent = ((e.clientX - rect.left) / rect.width) * 100;
      const clampedWidth = Math.max(35, Math.min(65, newWidthPercent));
      setEditorWidth(clampedWidth);
    },
    [isDesktop, isResizing],
  );

  useEffect(() => {
    if (!isResizing) return;
    document.body.style.cursor = "col-resize";
    document.body.style.userSelect = "none";
    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("mouseup", handleMouseUp);

    return () => {
      document.body.style.cursor = "";
      document.body.style.userSelect = "";
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseup", handleMouseUp);
    };
  }, [handleMouseMove, handleMouseUp, isResizing]);

  useEffect(() => {
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape" && isPreviewFullscreen) {
        setIsPreviewFullscreen(false);
      }
    };
    window.addEventListener("keydown", handleEscape);
    return () => window.removeEventListener("keydown", handleEscape);
  }, [isPreviewFullscreen]);

  useEffect(() => {
    return () => {
      if (scrollSyncRafRef.current !== null) {
        cancelAnimationFrame(scrollSyncRafRef.current);
      }
    };
  }, []);

  const syncScrollByRatio = useCallback((source: "editor" | "preview") => {
    const editor = editorTextareaRef.current;
    const preview = previewScrollRef.current;
    if (!editor || !preview) return;

    const sourceElement = source === "editor" ? editor : preview;
    const targetElement = source === "editor" ? preview : editor;

    const sourceScrollableHeight =
      sourceElement.scrollHeight - sourceElement.clientHeight;
    const targetScrollableHeight =
      targetElement.scrollHeight - targetElement.clientHeight;

    const ratio =
      sourceScrollableHeight > 0
        ? sourceElement.scrollTop / sourceScrollableHeight
        : 0;
    const nextScrollTop = ratio * targetScrollableHeight;

    if (Math.abs(targetElement.scrollTop - nextScrollTop) > 1) {
      targetElement.scrollTop = nextScrollTop;
    }
  }, []);

  const handleSyncedScroll = useCallback(
    (source: "editor" | "preview") => {
      if (!isDesktop || isPreviewFullscreen || workspaceMode !== "split")
        return;

      if (
        scrollSyncSourceRef.current &&
        scrollSyncSourceRef.current !== source
      ) {
        return;
      }

      scrollSyncSourceRef.current = source;
      syncScrollByRatio(source);

      if (scrollSyncRafRef.current !== null) {
        cancelAnimationFrame(scrollSyncRafRef.current);
      }
      scrollSyncRafRef.current = requestAnimationFrame(() => {
        scrollSyncSourceRef.current = null;
      });
    },
    [isDesktop, isPreviewFullscreen, syncScrollByRatio, workspaceMode],
  );

  const handleOutlineClick = useCallback(
    (outlineIndex: number) => {
      if (!isDesktop) {
        if (workspaceMode === "focus") {
          setWorkspaceMode("preview");
        } else if (mobileTab === "editor") {
          setMobileTab("preview");
        }
      }

      requestAnimationFrame(() => {
        const preview = previewScrollRef.current;
        if (!preview) return;

        const headings = preview.querySelectorAll("h1, h2, h3, h4, h5, h6");
        const targetHeading = headings[outlineIndex] as HTMLElement | undefined;
        if (!targetHeading) return;

        preview.scrollTo({
          top: Math.max(0, targetHeading.offsetTop - 12),
          behavior: "smooth",
        });
      });
    },
    [isDesktop, mobileTab, workspaceMode],
  );

  const handleClearMarkdown = useCallback(() => {
    if (!markdown.trim()) {
      setMarkdown("");
      return;
    }

    const confirmed = window.confirm(
      "Очистить текст редактора? Это действие нельзя отменить.",
    );
    if (confirmed) {
      setMarkdown("");
    }
  }, [markdown]);

  const handleResizeSeparatorKeyDown = useCallback(
    (event: React.KeyboardEvent<HTMLDivElement>) => {
      if (!isDesktop) return;

      const step = event.shiftKey ? 5 : 2;

      if (event.key === "ArrowLeft") {
        event.preventDefault();
        setEditorWidth((prev) => Math.max(35, prev - step));
      } else if (event.key === "ArrowRight") {
        event.preventDefault();
        setEditorWidth((prev) => Math.min(65, prev + step));
      } else if (event.key === "Home") {
        event.preventDefault();
        setEditorWidth(35);
      } else if (event.key === "End") {
        event.preventDefault();
        setEditorWidth(65);
      }
    },
    [isDesktop],
  );

  const showEditorPanel = !isPreviewFullscreen && workspaceMode !== "preview";
  const showPreviewPanel = workspaceMode !== "focus";
  const showStats = true;
  const showOutline = !isPreviewFullscreen && workspaceMode !== "focus";
  const resourceLinks = [
    {
      href: "#section-what-is",
      label: "О редакторе",
    },
    {
      href: "#section-why-choose",
      label: "Преимущества",
    },
    {
      href: "#section-cheatsheet",
      label: "Шпаргалка по Markdown",
    },
  ] as const;

  const themeSwitcher = (
    <Tabs
      value={themeMode}
      onValueChange={(value) => {
        if (isThemeMode(value)) {
          setThemeMode(value);
        }
      }}
    >
      <TabsList className="h-9 p-0.5">
        <TabsTrigger
          value="light"
          className="h-8 w-8 p-0"
          aria-label="Светлая тема"
          title="Светлая тема"
        >
          <Sun className="h-3.5 w-3.5" />
          <span className="sr-only">Светлая</span>
        </TabsTrigger>
        <TabsTrigger
          value="dark"
          className="h-8 w-8 p-0"
          aria-label="Тёмная тема"
          title="Тёмная тема"
        >
          <Moon className="h-3.5 w-3.5" />
          <span className="sr-only">Тёмная</span>
        </TabsTrigger>
        <TabsTrigger
          value="system"
          className="h-8 w-8 p-0"
          aria-label="Системная тема"
          title="Системная тема"
        >
          <Monitor className="h-3.5 w-3.5" />
          <span className="sr-only">Системная</span>
        </TabsTrigger>
      </TabsList>
    </Tabs>
  );

  const previewPanel = (
    <div className="flex h-full min-h-[48vh] flex-col overflow-hidden rounded-2xl border bg-card">
      <div className="flex h-14 items-center justify-between border-b px-4">
        <div className="flex items-center gap-2">
          <FileCode2 className="h-4 w-4 text-primary" />
          <h2 className="text-sm font-semibold">Предпросмотр</h2>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={handleCopy}>
            {isCopied ? (
              <ClipboardCheck className="h-4 w-4" />
            ) : (
              <Copy className="h-4 w-4" />
            )}
            {isCopied ? "Скопировано" : "Копировать"}
          </Button>
          <span className="sr-only" aria-live="polite">
            {isCopied ? "Содержимое предпросмотра скопировано в буфер обмена." : ""}
          </span>
          <Button
            variant="outline"
            size="icon"
            className="h-9 w-9"
            onClick={() => setIsPreviewFullscreen((prev) => !prev)}
            aria-label={
              isPreviewFullscreen
                ? "Выйти из полноэкранного режима"
                : "Войти в полноэкранный режим"
            }
          >
            {isPreviewFullscreen ? (
              <Minimize className="h-4 w-4" />
            ) : (
              <Expand className="h-4 w-4" />
            )}
          </Button>
        </div>
      </div>
      <div
        ref={previewScrollRef}
        onScroll={() => handleSyncedScroll("preview")}
        className="markdown-body scrollbar-modern flex-1 overflow-y-auto px-5 py-4"
        dangerouslySetInnerHTML={{ __html: renderedHtml }}
      />
    </div>
  );

  return (
    <div className="min-h-screen bg-background">
      <a href="#main-content" className="skip-link">
        Перейти к основному содержимому
      </a>
      <main id="main-content">
        <div className="mx-auto w-full max-w-[1820px] space-y-6 px-4 py-6 md:space-y-8 md:px-6 md:py-10 xl:px-8">
          <Card className="glass-surface w-full rounded-2xl border-white/50">
            <CardContent className="px-3 py-2 md:px-4 md:py-2.5">
              <div className="flex items-center gap-2">
                <a
                  href="/"
                  className="flex items-center gap-2 rounded-md px-1 py-1 text-foreground transition-colors hover:bg-accent/40"
                  aria-label="Перейти на главную страницу редактора"
                >
                  <span className="flex h-8 w-8 items-center justify-center rounded-md">
                    <img
                      src="/logo-markflow.svg"
                      alt=""
                      width={32}
                      height={32}
                      className="h-8 w-8"
                      loading="eager"
                    />
                  </span>
                  <span className="text-sm font-semibold tracking-tight md:text-[15px]">
                    Markdown Редактор
                  </span>
                </a>

                <nav
                  className="ml-1 hidden items-center gap-0.5 lg:flex"
                  aria-label="Полезные материалы"
                >
                  {resourceLinks.map((link) => (
                    <Button
                      key={link.href}
                      asChild
                      variant="ghost"
                      size="sm"
                      className="h-8 px-2.5 text-[13px]"
                    >
                      <a href={link.href}>{link.label}</a>
                    </Button>
                  ))}
                </nav>

                <div className="ml-auto flex items-center gap-1.5">
                  {themeSwitcher}
                  <Button
                    type="button"
                    variant="outline"
                    size="icon"
                    className="h-9 w-9 lg:hidden"
                    aria-label={
                      isTopMenuOpen ? "Свернуть меню" : "Развернуть меню"
                    }
                    onClick={() => setIsTopMenuOpen((prev) => !prev)}
                  >
                    {isTopMenuOpen ? (
                      <X className="h-4 w-4" />
                    ) : (
                      <Menu className="h-4 w-4" />
                    )}
                  </Button>
                </div>
              </div>

              {isTopMenuOpen && (
                <div className="mt-2 border-t pt-2 lg:hidden">
                  <nav
                    className="grid gap-2"
                    aria-label="Мобильное меню ссылок"
                  >
                    {resourceLinks.map((link) => (
                      <a
                        key={link.href}
                        href={link.href}
                        className="rounded-md border bg-background/50 px-3 py-1.5 text-sm font-medium text-foreground transition-colors hover:bg-accent/40"
                        onClick={() => setIsTopMenuOpen(false)}
                      >
                        {link.label}
                      </a>
                    ))}
                  </nav>
                </div>
              )}
            </CardContent>
          </Card>

          <Card className="hero-accent glass-surface overflow-hidden rounded-3xl border-white/20">
            <CardContent className="p-6 md:p-10">
              <div className="space-y-4">
                <h1 className="pr-2 text-4xl font-bold tracking-tight text-foreground md:pr-0 md:text-5xl">
                  Интерактивный Markdown Редактор
                </h1>
                <CardDescription className="max-w-3xl text-base leading-relaxed md:text-lg">
                  Простой и современный инструмент для написания и предпросмотра
                  Markdown в реальном времени. Просто печатайте в левой панели и
                  мгновенно увидите результат справа.
                </CardDescription>
              </div>
            </CardContent>
          </Card>

          {showStats && (
            <Card className="glass-surface">
              <CardContent className="p-4 md:p-5">
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                  <div className="flex items-center gap-3 rounded-xl border bg-background/40 px-3 py-3">
                    <div className="rounded-lg bg-primary/10 p-2 text-primary">
                      <Type className="h-4 w-4" />
                    </div>
                    <div>
                      <p className="text-xs uppercase tracking-wider text-muted-foreground">
                        Слов
                      </p>
                      <p className="text-xl font-semibold leading-none">
                        {stats.words}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 rounded-xl border bg-background/40 px-3 py-3">
                    <div className="rounded-lg bg-primary/10 p-2 text-primary">
                      <Type className="h-4 w-4" />
                    </div>
                    <div>
                      <p className="text-xs uppercase tracking-wider text-muted-foreground">
                        Символов
                      </p>
                      <p className="text-xl font-semibold leading-none">
                        {stats.charsWithSpaces}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 rounded-xl border bg-background/40 px-3 py-3">
                    <div className="rounded-lg bg-primary/10 p-2 text-primary">
                      <Type className="h-4 w-4" />
                    </div>
                    <div>
                      <p className="text-xs uppercase tracking-wider text-muted-foreground">
                        Без пробелов
                      </p>
                      <p className="text-xl font-semibold leading-none">
                        {stats.charsWithoutSpaces}
                      </p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          <section className="grid gap-4 md:grid-cols-2">
            <Card className="glass-surface">
              <CardContent className="p-4">
                <h2 className="text-sm font-semibold text-foreground">
                  Режим редактора
                </h2>
                <div className="mt-3 flex flex-wrap items-center gap-2">
                  <Button
                    variant={workspaceMode === "split" ? "default" : "outline"}
                    size="sm"
                    onClick={() => setWorkspaceMode("split")}
                  >
                    <Columns2 className="h-4 w-4" />
                    Разделение
                  </Button>
                  <Button
                    variant={
                      workspaceMode === "preview" ? "default" : "outline"
                    }
                    size="sm"
                    onClick={() => setWorkspaceMode("preview")}
                  >
                    <Eye className="h-4 w-4" />
                    Только превью
                  </Button>
                  <Button
                    variant={workspaceMode === "focus" ? "default" : "outline"}
                    size="sm"
                    onClick={() => setWorkspaceMode("focus")}
                  >
                    <Focus className="h-4 w-4" />
                    Фокус
                  </Button>
                </div>
              </CardContent>
            </Card>

            <Card className="glass-surface">
              <CardContent className="p-4">
                <h2 className="text-sm font-semibold text-foreground">
                  Экспорт
                </h2>
                <div className="mt-3 flex flex-wrap items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleExportMarkdown}
                  >
                    <FileText className="h-4 w-4" />
                    .md
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleExportHtml}
                  >
                    <Download className="h-4 w-4" />
                    .html
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleExportPdf}
                    disabled={isExportingPdf}
                  >
                    <Download className="h-4 w-4" />
                    {isExportingPdf ? "Генерация PDF…" : ".pdf"}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </section>

          {isDesktop ? (
            <Card className="glass-surface">
              <CardContent className="p-4">
                <div
                  ref={editorPreviewContainerRef}
                  className={`flex items-stretch ${
                    isPreviewFullscreen ||
                    workspaceMode === "preview" ||
                    workspaceMode === "focus"
                      ? "h-[76vh]"
                      : "h-[68vh]"
                  }`}
                >
                  {showEditorPanel && (
                    <MarkdownEditorPane
                      markdown={markdown}
                      onMarkdownChange={setMarkdown}
                      onClear={handleClearMarkdown}
                      textareaRef={editorTextareaRef}
                      onScroll={() => handleSyncedScroll("editor")}
                      showWordBadge
                      wordCount={stats.words}
                      className="flex h-full min-h-0 flex-col overflow-hidden rounded-2xl border bg-card"
                      style={{
                        width: showPreviewPanel ? `${editorWidth}%` : "100%",
                      }}
                      textareaClassName="scrollbar-modern h-full w-full flex-1 resize-none bg-transparent p-4 font-mono text-sm leading-7 text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                    />
                  )}

                  {showEditorPanel && showPreviewPanel && (
                    <div
                      onMouseDown={handleMouseDown}
                      onKeyDown={handleResizeSeparatorKeyDown}
                      className="group flex w-6 flex-shrink-0 cursor-col-resize items-center justify-center"
                      role="separator"
                      aria-orientation="vertical"
                      aria-label="Изменить ширину панелей"
                      tabIndex={0}
                      aria-valuemin={35}
                      aria-valuemax={65}
                      aria-valuenow={Math.round(editorWidth)}
                    >
                      <div className="h-10 w-1 rounded-full bg-border transition-colors group-hover:bg-primary/60" />
                    </div>
                  )}

                  {showPreviewPanel && (
                    <div
                      className={`h-full min-h-0 ${showEditorPanel ? "flex-1" : "w-full"}`}
                    >
                      {previewPanel}
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          ) : (
            <Card className="glass-surface">
              <CardContent className="p-4">
                {workspaceMode === "focus" ? (
                  <MarkdownEditorPane
                    markdown={markdown}
                    onMarkdownChange={setMarkdown}
                    onClear={handleClearMarkdown}
                    textareaRef={editorTextareaRef}
                    textareaClassName="scrollbar-modern h-[64vh] w-full resize-none bg-transparent p-4 font-mono text-sm leading-7 text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  />
                ) : workspaceMode === "preview" ? (
                  previewPanel
                ) : (
                  <Tabs
                    value={mobileTab}
                    onValueChange={(value) => setMobileTab(value as MobileTab)}
                  >
                    <TabsList className="grid w-full grid-cols-2">
                      <TabsTrigger value="editor">Редактор</TabsTrigger>
                      <TabsTrigger value="preview">Превью</TabsTrigger>
                    </TabsList>
                    <TabsContent value="editor">
                      <MarkdownEditorPane
                        markdown={markdown}
                        onMarkdownChange={setMarkdown}
                        onClear={handleClearMarkdown}
                        textareaRef={editorTextareaRef}
                        textareaClassName="scrollbar-modern h-[52vh] w-full resize-none bg-transparent p-4 font-mono text-sm leading-7 text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                      />
                    </TabsContent>
                    <TabsContent value="preview">{previewPanel}</TabsContent>
                  </Tabs>
                )}
              </CardContent>
            </Card>
          )}

          {showOutline && (
            <Card className="glass-surface">
              <CardHeader className="pb-3">
                <CardTitle className="text-base">Структура документа</CardTitle>
                <CardDescription>
                  Количество заголовков по уровням
                </CardDescription>
                <div className="mt-2 flex flex-wrap gap-2">
                  {headingLevelCounts.map((item) => (
                    <Badge key={item.level} variant="secondary">
                      {item.level}: {item.count}
                    </Badge>
                  ))}
                </div>
              </CardHeader>
              <CardContent className="space-y-2">
                {outline.length > 0 ? (
                  outline.map((header, index) => (
                    <button
                      key={`${header.text}-${index}`}
                      type="button"
                      onClick={() => handleOutlineClick(index)}
                      className="w-full rounded-lg border bg-background/40 px-3 py-2 text-left transition-colors hover:bg-accent/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                    >
                      <div
                        className="flex items-center gap-2"
                        style={{
                          paddingLeft: `${(header.level - 1) * 0.8}rem`,
                        }}
                      >
                        <Badge variant="outline">H{header.level}</Badge>
                        <span className="truncate text-sm text-foreground/90">
                          {header.text}
                        </span>
                      </div>
                    </button>
                  ))
                ) : (
                  <p className="text-sm italic text-muted-foreground">
                    Заголовки в документе не найдены.
                  </p>
                )}
              </CardContent>
            </Card>
          )}

          <KnowledgeSections />

          <Separator />
        </div>
      </main>
    </div>
  );
}

export default App;
