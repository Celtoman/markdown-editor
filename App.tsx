import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import DOMPurify from "dompurify";
import { marked } from "marked";
import {
  ClipboardCheck,
  Copy,
  Expand,
  FileCode2,
  Heading,
  Minimize,
  Trash2,
  Type,
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

const STORAGE_KEY = "interactive-markdown-editor-content-v2";

const initialMarkdown = `# Добро пожаловать в Markdown Редактор!

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

const StatItem = ({ icon, label, value }: { icon: React.ReactNode; label: string; value: string | number }) => (
  <Card className="glass-surface">
    <CardContent className="p-4">
      <div className="flex items-center gap-3">
        <div className="rounded-xl bg-primary/10 p-2 text-primary">{icon}</div>
        <div>
          <div className="text-xl font-semibold tracking-tight">{value}</div>
          <div className="text-xs uppercase tracking-wider text-muted-foreground">{label}</div>
        </div>
      </div>
    </CardContent>
  </Card>
);

function App() {
  const [markdown, setMarkdown] = useState<string>(initialMarkdown);
  const [isCopied, setIsCopied] = useState<boolean>(false);
  const [editorWidth, setEditorWidth] = useState(48);
  const [isResizing, setIsResizing] = useState(false);
  const [isPreviewFullscreen, setIsPreviewFullscreen] = useState(false);
  const [mobileTab, setMobileTab] = useState<MobileTab>("editor");
  const [isDesktop, setIsDesktop] = useState<boolean>(() => {
    if (typeof window === "undefined") return true;
    return window.matchMedia("(min-width: 1024px)").matches;
  });

  const editorPreviewContainerRef = useRef<HTMLDivElement>(null);

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
    return DOMPurify.sanitize(unsafeHtml as string, { USE_PROFILES: { html: true } });
  }, [markdown]);

  const plainText = useMemo(() => {
    if (typeof window === "undefined") return "";
    const tempDiv = document.createElement("div");
    tempDiv.innerHTML = renderedHtml;
    return tempDiv.textContent || tempDiv.innerText || "";
  }, [renderedHtml]);

  const stats = useMemo(() => {
    const words = plainText.trim() === "" ? 0 : plainText.trim().split(/\s+/).filter(Boolean).length;
    const charsWithSpaces = plainText.length;
    const charsWithoutSpaces = plainText.replace(/\s/g, "").length;

    const headerCounts: Record<"h1" | "h2" | "h3" | "h4" | "h5" | "h6", number> = {
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

    const headingsTotal = Object.values(headerCounts).reduce((sum, count) => sum + count, 0);
    return { words, charsWithSpaces, charsWithoutSpaces, headerCounts, headingsTotal };
  }, [markdown, plainText]);

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

  const handleMouseDown = (e: React.MouseEvent) => {
    if (!isDesktop) return;
    e.preventDefault();
    setIsResizing(true);
  };

  const handleMouseUp = useCallback(() => setIsResizing(false), []);

  const handleMouseMove = useCallback(
    (e: MouseEvent) => {
      if (!isDesktop || !isResizing || !editorPreviewContainerRef.current) return;
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

  const previewPanel = (
    <div className="flex h-full min-h-[48vh] flex-col overflow-hidden rounded-2xl border bg-card">
      <div className="flex h-14 items-center justify-between border-b px-4">
        <div className="flex items-center gap-2">
          <FileCode2 className="h-4 w-4 text-primary" />
          <h2 className="text-sm font-semibold">Предпросмотр</h2>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={handleCopy}>
            {isCopied ? <ClipboardCheck className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
            {isCopied ? "Скопировано" : "Копировать"}
          </Button>
          <Button
            variant="outline"
            size="icon"
            className="h-9 w-9"
            onClick={() => setIsPreviewFullscreen((prev) => !prev)}
            aria-label={isPreviewFullscreen ? "Выйти из полноэкранного режима" : "Войти в полноэкранный режим"}
          >
            {isPreviewFullscreen ? <Minimize className="h-4 w-4" /> : <Expand className="h-4 w-4" />}
          </Button>
        </div>
      </div>
      <div className="markdown-body scrollbar-modern flex-1 overflow-y-auto px-5 py-4" dangerouslySetInnerHTML={{ __html: renderedHtml }} />
    </div>
  );

  return (
    <div className="min-h-screen bg-background">
      <div className="mx-auto w-full max-w-[1820px] space-y-6 px-4 py-6 md:space-y-8 md:px-6 md:py-10 xl:px-8">
        <Card className="glass-surface overflow-hidden rounded-3xl border-white/20">
          <CardHeader className="space-y-3 p-6 md:p-10">
            <h1 className="text-4xl font-bold tracking-tight text-foreground md:text-5xl">Интерактивный Markdown Редактор</h1>
            <CardDescription className="max-w-3xl text-base leading-relaxed md:text-lg">
              Простой и современный инструмент для написания и предпросмотра Markdown в реальном времени. Просто печатайте в левой панели и мгновенно увидите результат справа.
            </CardDescription>
          </CardHeader>
        </Card>

        <section className="grid grid-cols-2 gap-3 lg:grid-cols-4">
          <StatItem icon={<Type className="h-4 w-4" />} label="Слов" value={stats.words} />
          <StatItem icon={<Type className="h-4 w-4" />} label="Символов" value={stats.charsWithSpaces} />
          <StatItem icon={<Type className="h-4 w-4" />} label="Без пробелов" value={stats.charsWithoutSpaces} />
          <StatItem icon={<Heading className="h-4 w-4" />} label="Заголовков" value={stats.headingsTotal} />
        </section>

        {isDesktop ? (
          <Card className="glass-surface">
            <CardContent className="p-4">
              <div ref={editorPreviewContainerRef} className={`flex items-stretch ${isPreviewFullscreen ? "h-[76vh]" : "h-[68vh]"}`}>
                {!isPreviewFullscreen && (
                  <>
                    <div
                      className="flex h-full min-h-0 flex-col overflow-hidden rounded-2xl border bg-card"
                      style={{ width: `${editorWidth}%` }}
                    >
                      <div className="flex h-14 items-center justify-between border-b px-4">
                        <h2 className="text-sm font-semibold">Markdown</h2>
                        <div className="flex items-center gap-2">
                          <Badge variant="outline">{stats.words} слов</Badge>
                          <Button variant="outline" size="sm" onClick={() => setMarkdown("")}>
                            <Trash2 className="h-4 w-4" />
                            Очистить
                          </Button>
                        </div>
                      </div>
                      <textarea
                        value={markdown}
                        onChange={(e) => setMarkdown(e.target.value)}
                        className="scrollbar-modern h-full w-full flex-1 resize-none bg-transparent p-4 font-mono text-sm leading-7 text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                        placeholder="Пиши Markdown здесь..."
                        aria-label="Markdown Input"
                      />
                    </div>

                    <div
                      onMouseDown={handleMouseDown}
                      className="group flex w-6 flex-shrink-0 cursor-col-resize items-center justify-center"
                      role="separator"
                      aria-orientation="vertical"
                      aria-label="Resize panels"
                    >
                      <div className="h-10 w-1 rounded-full bg-border transition-colors group-hover:bg-primary/60" />
                    </div>
                  </>
                )}
                <div className={`h-full min-h-0 ${isPreviewFullscreen ? "w-full" : "flex-1"}`}>{previewPanel}</div>
              </div>
            </CardContent>
          </Card>
        ) : (
          <Card className="glass-surface">
            <CardContent className="p-4">
              <Tabs value={mobileTab} onValueChange={(value) => setMobileTab(value as MobileTab)}>
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="editor">Редактор</TabsTrigger>
                  <TabsTrigger value="preview">Превью</TabsTrigger>
                </TabsList>
                <TabsContent value="editor">
                  <div className="overflow-hidden rounded-2xl border bg-card">
                    <div className="flex h-14 items-center justify-between border-b px-4">
                      <h2 className="text-sm font-semibold">Markdown</h2>
                      <Button variant="outline" size="sm" onClick={() => setMarkdown("")}>
                        <Trash2 className="h-4 w-4" />
                        Очистить
                      </Button>
                    </div>
                    <textarea
                      value={markdown}
                      onChange={(e) => setMarkdown(e.target.value)}
                      className="scrollbar-modern h-[52vh] w-full resize-none bg-transparent p-4 font-mono text-sm leading-7 text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                      placeholder="Пиши Markdown здесь..."
                      aria-label="Markdown Input"
                    />
                  </div>
                </TabsContent>
                <TabsContent value="preview">{previewPanel}</TabsContent>
              </Tabs>
            </CardContent>
          </Card>
        )}

        {!isPreviewFullscreen && (
          <Card className="glass-surface">
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Структура документа</CardTitle>
              <CardDescription>Быстрый обзор заголовков H1-H6</CardDescription>
            </CardHeader>
            <CardContent className="space-y-2">
              {outline.length > 0 ? (
                outline.map((header, index) => (
                  <div key={`${header.text}-${index}`} className="rounded-lg border bg-background/40 px-3 py-2">
                    <div className="flex items-center gap-2" style={{ paddingLeft: `${(header.level - 1) * 0.8}rem` }}>
                      <Badge variant="outline">H{header.level}</Badge>
                      <span className="truncate text-sm text-foreground/90">{header.text}</span>
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-sm italic text-muted-foreground">Заголовки в документе не найдены.</p>
              )}
            </CardContent>
          </Card>
        )}

        <Separator />
      </div>
    </div>
  );
}

export default App;
