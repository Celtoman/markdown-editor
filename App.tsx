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
  Monitor,
  Moon,
  Minimize,
  Sun,
  Trash2,
  Type,
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
type ThemeMode = "light" | "dark" | "system";

const THEME_COOKIE_KEY = "markdown-editor-theme";

const getCookie = (name: string) => {
  if (typeof document === "undefined") return null;
  const escaped = name.replace(/[-[\]/{}()*+?.\\^$|]/g, "\\$&");
  const match = document.cookie.match(new RegExp(`(?:^|; )${escaped}=([^;]*)`));
  return match ? decodeURIComponent(match[1]) : null;
};

const setCookie = (
  name: string,
  value: string,
  maxAgeSeconds = 60 * 60 * 24 * 365,
) => {
  if (typeof document === "undefined") return;
  document.cookie = `${name}=${encodeURIComponent(value)}; path=/; max-age=${maxAgeSeconds}; samesite=lax`;
};

const getExportFileName = (extension: "md" | "html" | "pdf") => {
  const now = new Date();
  const yyyy = now.getFullYear();
  const mm = String(now.getMonth() + 1).padStart(2, "0");
  const dd = String(now.getDate()).padStart(2, "0");
  const hh = String(now.getHours()).padStart(2, "0");
  const min = String(now.getMinutes()).padStart(2, "0");
  return `markdown-${yyyy}${mm}${dd}-${hh}${min}.${extension}`;
};

const buildExportHtmlDocument = (contentHtml: string) => `<!doctype html>
<html lang="ru">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Markdown Export</title>
  <style>
    body { font-family: -apple-system, Segoe UI, Roboto, Arial, sans-serif; color:#1f2937; line-height:1.65; max-width:960px; margin:32px auto; padding:0 20px; }
    h1,h2,h3,h4,h5,h6 { line-height:1.25; margin:1.2em 0 .5em; }
    h1,h2 { border-bottom:1px solid #e5e7eb; padding-bottom:.3em; }
    p,ul,ol,blockquote,pre,table { margin:0 0 1em; }
    ul,ol { padding-left:1.4em; }
    blockquote { border-left:4px solid #d1d5db; margin-left:0; padding-left:1em; color:#6b7280; font-style:italic; }
    code { background:#f3f4f6; border-radius:6px; padding:.12em .4em; }
    pre { background:#f3f4f6; border-radius:12px; padding:14px; overflow:auto; }
    pre code { background:transparent; padding:0; }
    table { border-collapse:collapse; width:100%; }
    th,td { border:1px solid #e5e7eb; padding:8px 10px; text-align:left; }
    img { max-width:100%; height:auto; }
  </style>
</head>
<body>
${contentHtml}
</body>
</html>`;

function App() {
  const [markdown, setMarkdown] = useState<string>(initialMarkdown);
  const [isCopied, setIsCopied] = useState<boolean>(false);
  const [editorWidth, setEditorWidth] = useState(48);
  const [isResizing, setIsResizing] = useState(false);
  const [isPreviewFullscreen, setIsPreviewFullscreen] = useState(false);
  const [mobileTab, setMobileTab] = useState<MobileTab>("editor");
  const [workspaceMode, setWorkspaceMode] = useState<WorkspaceMode>("split");
  const [isExportingPdf, setIsExportingPdf] = useState(false);
  const [themeMode, setThemeMode] = useState<ThemeMode>(() => {
    const stored = getCookie(THEME_COOKIE_KEY);
    if (stored === "light" || stored === "dark" || stored === "system")
      return stored;
    return "system";
  });
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
    const saved = window.localStorage.getItem(STORAGE_KEY);
    if (saved) setMarkdown(saved);
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") return;
    window.localStorage.setItem(STORAGE_KEY, markdown);
  }, [markdown]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");

    const applyTheme = () => {
      const useDark =
        themeMode === "dark" || (themeMode === "system" && mediaQuery.matches);
      document.documentElement.classList.toggle("dark", useDark);
      document.documentElement.style.colorScheme = useDark ? "dark" : "light";
    };

    applyTheme();
    setCookie(THEME_COOKIE_KEY, themeMode);

    const handleSystemThemeChange = () => {
      if (themeMode === "system") {
        applyTheme();
      }
    };

    mediaQuery.addEventListener("change", handleSystemThemeChange);
    return () =>
      mediaQuery.removeEventListener("change", handleSystemThemeChange);
  }, [themeMode]);

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

  const downloadTextFile = useCallback(
    (fileName: string, fileContents: string, mimeType: string) => {
      const blob = new Blob([fileContents], { type: mimeType });
      const url = URL.createObjectURL(blob);
      const anchor = document.createElement("a");
      anchor.href = url;
      anchor.download = fileName;
      document.body.appendChild(anchor);
      anchor.click();
      anchor.remove();
      URL.revokeObjectURL(url);
    },
    [],
  );

  const handleExportMarkdown = useCallback(() => {
    downloadTextFile(
      getExportFileName("md"),
      markdown,
      "text/markdown;charset=utf-8",
    );
  }, [downloadTextFile, markdown]);

  const handleExportHtml = useCallback(() => {
    const htmlDocument = buildExportHtmlDocument(renderedHtml);
    downloadTextFile(
      getExportFileName("html"),
      htmlDocument,
      "text/html;charset=utf-8",
    );
  }, [downloadTextFile, renderedHtml]);

  const handleExportPdf = useCallback(() => {
    if (isExportingPdf) return;

    const exportPdf = async () => {
      setIsExportingPdf(true);
      const container = document.createElement("div");
      container.setAttribute("aria-hidden", "true");
      container.style.position = "fixed";
      container.style.left = "-99999px";
      container.style.top = "0";
      container.style.width = "794px";
      container.style.background = "#ffffff";
      container.style.color = "#1f2937";
      container.style.padding = "0";

      container.innerHTML = `
        <style>
          .pdf-root { font-family: -apple-system, "Segoe UI", Roboto, Arial, sans-serif; line-height: 1.65; max-width: 960px; margin: 0 auto; padding: 32px 20px; color: #1f2937; }
          .pdf-root h1,.pdf-root h2,.pdf-root h3,.pdf-root h4,.pdf-root h5,.pdf-root h6 { line-height: 1.25; margin: 1.2em 0 .5em; font-weight: 700; }
          .pdf-root h1 { font-size: 2rem; font-weight: 800; }
          .pdf-root h2 { font-size: 1.6rem; }
          .pdf-root h3 { font-size: 1.35rem; }
          .pdf-root h4 { font-size: 1.15rem; }
          .pdf-root h5 { font-size: 1rem; }
          .pdf-root h6 { font-size: 0.92rem; }
          .pdf-root h1,.pdf-root h2 { border-bottom: 1px solid #e5e7eb; padding-bottom: .3em; }
          .pdf-root p,.pdf-root ul,.pdf-root ol,.pdf-root blockquote,.pdf-root pre,.pdf-root table { margin: 0 0 1em; font-size: 1rem; }
          .pdf-root ul,.pdf-root ol { padding-left: 1.4em; }
          .pdf-root li + li { margin-top: .25em; }
          .pdf-root strong { font-weight: 700; }
          .pdf-root em { font-style: italic; }
          .pdf-root blockquote { border-left: 4px solid #d1d5db; margin-left: 0; padding-left: 1em; color: #6b7280; font-style: italic; }
          .pdf-root code { background: #f3f4f6; border-radius: 6px; padding: .12em .4em; font-family: ui-monospace, SFMono-Regular, Menlo, Consolas, monospace; }
          .pdf-root pre { background: #f3f4f6; border-radius: 12px; padding: 14px; overflow: hidden; white-space: pre-wrap; word-break: break-word; }
          .pdf-root pre code { background: transparent; padding: 0; font-size: .92em; line-height: 1.5; }
          .pdf-root table { border-collapse: collapse; width: 100%; }
          .pdf-root thead { background: #f8fafc; }
          .pdf-root th,.pdf-root td { border: 1px solid #e5e7eb; padding: 8px 10px; text-align: left; }
          .pdf-root img { max-width: 100%; height: auto; }
          .pdf-root h1,.pdf-root h2,.pdf-root h3,.pdf-root h4,.pdf-root h5,.pdf-root h6,
          .pdf-root p,.pdf-root blockquote,.pdf-root pre,.pdf-root table,
          .pdf-root ul,.pdf-root ol,.pdf-root li,.pdf-root img,.pdf-root hr {
            break-inside: avoid;
            page-break-inside: avoid;
          }
          .pdf-root p {
            orphans: 3;
            widows: 3;
          }
        </style>
        <article class="pdf-root">${renderedHtml}</article>
      `;

      document.body.appendChild(container);

      try {
        const html2PdfModule = await import("html2pdf.js");
        const html2pdf = (html2PdfModule.default ?? html2PdfModule) as {
          (): {
            set: (options: Record<string, unknown>) => {
              from: (element: HTMLElement) => { save: () => Promise<void> };
            };
          };
        };

        const target = container.querySelector(
          ".pdf-root",
        ) as HTMLElement | null;
        if (!target) throw new Error("PDF target not found");

        const options = {
          margin: [16, 16, 16, 16],
          filename: getExportFileName("pdf"),
          image: { type: "jpeg", quality: 0.98 },
          html2canvas: {
            scale: Math.min((window.devicePixelRatio || 1) * 1.5, 3),
            useCORS: true,
            backgroundColor: "#ffffff",
            logging: false,
            letterRendering: true,
          },
          jsPDF: {
            unit: "pt",
            format: "a4",
            orientation: "portrait",
            compress: true,
          },
          pagebreak: {
            mode: ["css", "legacy", "avoid-all"],
            avoid: [
              "h1",
              "h2",
              "h3",
              "h4",
              "h5",
              "h6",
              "p",
              "blockquote",
              "pre",
              "table",
              "ul",
              "ol",
              "li",
              "img",
              "hr",
            ],
          },
        };

        await html2pdf().set(options).from(target).save();
      } catch {
        window.alert("Не удалось экспортировать PDF. Попробуйте снова.");
      } finally {
        container.remove();
        setIsExportingPdf(false);
      }
    };

    void exportPdf();
  }, [isExportingPdf, renderedHtml]);

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
          <Card className="hero-accent glass-surface overflow-hidden rounded-3xl border-white/20">
            <div className="absolute right-4 top-4 z-20 md:right-6 md:top-6">
              <Card className="glass-surface w-fit">
                <CardContent className="p-2">
                  <Tabs
                    value={themeMode}
                    onValueChange={(value) => setThemeMode(value as ThemeMode)}
                  >
                    <TabsList className="h-9">
                      <TabsTrigger
                        value="light"
                        className="h-7 w-8 p-0"
                        aria-label="Светлая тема"
                        title="Светлая тема"
                      >
                        <Sun className="h-4 w-4" />
                        <span className="sr-only">Светлая</span>
                      </TabsTrigger>
                      <TabsTrigger
                        value="dark"
                        className="h-7 w-8 p-0"
                        aria-label="Тёмная тема"
                        title="Тёмная тема"
                      >
                        <Moon className="h-4 w-4" />
                        <span className="sr-only">Тёмная</span>
                      </TabsTrigger>
                      <TabsTrigger
                        value="system"
                        className="h-7 w-8 p-0"
                        aria-label="Системная тема"
                        title="Системная тема"
                      >
                        <Monitor className="h-4 w-4" />
                        <span className="sr-only">Системная</span>
                      </TabsTrigger>
                    </TabsList>
                  </Tabs>
                </CardContent>
              </Card>
            </div>
            <CardContent className="p-6 pt-20 md:p-10">
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
                    <div
                      className="flex h-full min-h-0 flex-col overflow-hidden rounded-2xl border bg-card"
                      style={{
                        width: showPreviewPanel ? `${editorWidth}%` : "100%",
                      }}
                    >
                      <div className="flex h-14 items-center justify-between border-b px-4">
                        <h2 className="text-sm font-semibold">
                          Редактор Markdown
                        </h2>
                        <div className="flex items-center gap-2">
                          <Badge variant="outline">{stats.words} слов</Badge>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={handleClearMarkdown}
                          >
                            <Trash2 className="h-4 w-4" />
                            Очистить
                          </Button>
                        </div>
                      </div>
                      <textarea
                        ref={editorTextareaRef}
                        value={markdown}
                        onChange={(e) => setMarkdown(e.target.value)}
                        onScroll={() => handleSyncedScroll("editor")}
                        className="scrollbar-modern h-full w-full flex-1 resize-none bg-transparent p-4 font-mono text-sm leading-7 text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                        placeholder="Пиши Markdown здесь…"
                        aria-label="Поле ввода Markdown"
                        name="markdown"
                        autoComplete="off"
                        spellCheck={false}
                        autoCapitalize="off"
                        autoCorrect="off"
                      />
                    </div>
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
                  <div className="overflow-hidden rounded-2xl border bg-card">
                    <div className="flex h-14 items-center justify-between border-b px-4">
                      <h2 className="text-sm font-semibold">
                        Редактор Markdown
                      </h2>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={handleClearMarkdown}
                      >
                        <Trash2 className="h-4 w-4" />
                        Очистить
                      </Button>
                    </div>
                    <textarea
                      ref={editorTextareaRef}
                      value={markdown}
                      onChange={(e) => setMarkdown(e.target.value)}
                      className="scrollbar-modern h-[64vh] w-full resize-none bg-transparent p-4 font-mono text-sm leading-7 text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                      placeholder="Пиши Markdown здесь…"
                      aria-label="Поле ввода Markdown"
                      name="markdown"
                      autoComplete="off"
                      spellCheck={false}
                      autoCapitalize="off"
                      autoCorrect="off"
                    />
                  </div>
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
                      <div className="overflow-hidden rounded-2xl border bg-card">
                        <div className="flex h-14 items-center justify-between border-b px-4">
                          <h2 className="text-sm font-semibold">
                            Редактор Markdown
                          </h2>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={handleClearMarkdown}
                          >
                            <Trash2 className="h-4 w-4" />
                            Очистить
                          </Button>
                        </div>
                        <textarea
                          ref={editorTextareaRef}
                          value={markdown}
                          onChange={(e) => setMarkdown(e.target.value)}
                          className="scrollbar-modern h-[52vh] w-full resize-none bg-transparent p-4 font-mono text-sm leading-7 text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                          placeholder="Пиши Markdown здесь…"
                          aria-label="Поле ввода Markdown"
                          name="markdown"
                          autoComplete="off"
                          spellCheck={false}
                          autoCapitalize="off"
                          autoCorrect="off"
                        />
                      </div>
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

          <Separator />
        </div>
      </main>
    </div>
  );
}

export default App;
