
import React, { useState, useMemo, useCallback, useEffect, useRef } from 'react';
import DOMPurify from 'dompurify';

// This tells TypeScript that the `marked` library is available globally,
// as it's included via a <script> tag in index.html.
declare const marked: {
  parse(markdown: string, options?: object): string;
};

const initialMarkdown = `# H1: Добро пожаловать в Markdown Редактор!

Это живой предпросмотр вашего Markdown текста.

## H2: Основные возможности

- **Жирный текст** и *курсив*.
- Списки:
  1. Нумерованные списки
  2. С несколькими элементами
- \`встроенный код\` для коротких фрагментов.

### H3: Блоки кода

Вы также можете включать большие блоки кода:

\`\`\`javascript
// Простая функция
function greet(name) {
  console.log('Привет, ' + name + '!');
}
greet('Мир');
\`\`\`

## H2: Другой раздел

> Цитаты отлично подходят для выделения важной информации.

И, конечно же, [ссылки на ваши любимые сайты](https://marked.js.org/).
`;

// Helper component for dashboard stats
const StatItem = ({ label, value, isLarge = false }: { label: string; value: string | number; isLarge?: boolean }) => (
    <div className="text-center">
        <div className={`font-bold text-foreground ${isLarge ? 'text-2xl' : 'text-lg'}`}>{value}</div>
        <div className="text-xs text-muted-foreground uppercase tracking-wider">{label}</div>
    </div>
);

const ExpandIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M15 3h6v6"/><path d="M9 21H3v-6"/><path d="M21 3l-7 7"/><path d="M3 21l7-7"/></svg>
);

const CollapseIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M8 3v3a2 2 0 0 1-2 2H3m18 0h-3a2 2 0 0 1-2-2V3m0 18v-3a2 2 0 0 1 2-2h3M3 16h3a2 2 0 0 1 2 2v3"/></svg>
);

const DragHandleIcon = () => (
    <svg 
      xmlns="http://www.w3.org/2000/svg" 
      width="24" 
      height="24" 
      viewBox="0 0 24 24" 
      fill="currentColor" 
      className="w-6 h-6 text-muted-foreground/50 group-hover:text-primary transition-colors duration-200"
    >
      <circle cx="9.5" cy="8" r="1.5"></circle>
      <circle cx="9.5" cy="12" r="1.5"></circle>
      <circle cx="9.5" cy="16" r="1.5"></circle>
      <circle cx="14.5" cy="8" r="1.5"></circle>
      <circle cx="14.5" cy="12" r="1.5"></circle>
      <circle cx="14.5" cy="16" r="1.5"></circle>
    </svg>
);


function App() {
  const [markdown, setMarkdown] = useState<string>(initialMarkdown);
  const [isCopied, setIsCopied] = useState<boolean>(false);
  const [editorWidth, setEditorWidth] = useState(50);
  const [isResizing, setIsResizing] = useState(false);
  const [isPreviewFullscreen, setIsPreviewFullscreen] = useState(false);
  const [isDesktop, setIsDesktop] = useState<boolean>(() => {
    if (typeof window === 'undefined') return true;
    return window.matchMedia('(min-width: 768px)').matches;
  });
  
  const editorPreviewContainerRef = useRef<HTMLDivElement>(null);

  const renderedHtml = useMemo(() => {
    if (typeof marked === 'undefined') {
      return '<p>Загрузка парсера...</p>';
    }
    const processedText = markdown.replace(/^(#{1,6})\s*H[1-6]:\s*/gm, '$1 ');
    const unsafeHtml = marked.parse(processedText, { gfm: true, breaks: true });
    return DOMPurify.sanitize(unsafeHtml, { USE_PROFILES: { html: true } });
  }, [markdown]);

  const plainText = useMemo(() => {
    if (typeof window === 'undefined') return '';
    const tempDiv = document.createElement('div');
    tempDiv.innerHTML = renderedHtml;
    return tempDiv.textContent || tempDiv.innerText || '';
  }, [renderedHtml]);

  const stats = useMemo(() => {
    const words = plainText.trim() === '' ? 0 : plainText.trim().split(/\s+/).filter(Boolean).length;
    const charsWithSpaces = plainText.length;
    const charsWithoutSpaces = plainText.replace(/\s/g, '').length;

    const headerCounts: { [key: string]: number } = { h1: 0, h2: 0, h3: 0, h4: 0, h5: 0, h6: 0 };
    const headerMatches = markdown.match(/^#{1,6}\s/gm);
    if (headerMatches) {
      headerMatches.forEach(match => {
        const level = match.trim().length;
        if (level >= 1 && level <= 6) {
          headerCounts[`h${level}`]++;
        }
      });
    }

    return { words, charsWithSpaces, charsWithoutSpaces, headerCounts };
  }, [plainText, markdown]);

  const outline = useMemo(() => {
    const lines = markdown.split('\n');
    const headers: { level: number; text: string }[] = [];
    const headerRegex = /^(#{1,6})\s*(.*)/;

    lines.forEach(line => {
      const match = line.match(headerRegex);
      if (match) {
        const level = match[1].length;
        const text = match[2].replace(/H[1-6]:\s*/, '').trim();
        if (text) {
          headers.push({ level, text });
        }
      }
    });
    return headers;
  }, [markdown]);

  const handleCopy = () => {
    if (isCopied) return;
    try {
      const htmlBlob = new Blob([renderedHtml], { type: 'text/html' });
      const textBlob = new Blob([plainText], { type: 'text/plain' });
      const clipboardItem = new ClipboardItem({
        'text/html': htmlBlob,
        'text/plain': textBlob,
      });

      navigator.clipboard.write([clipboardItem]).then(() => {
        setIsCopied(true);
        setTimeout(() => setIsCopied(false), 2000);
      }).catch(err => {
        console.error('Не удалось скопировать HTML, возврат к простому тексту: ', err);
        navigator.clipboard.writeText(plainText).then(() => {
            setIsCopied(true);
            setTimeout(() => setIsCopied(false), 2000);
        }).catch(err2 => {
            console.error('Не удалось скопировать текст: ', err2);
        });
      });
    } catch (e) {
      console.error('ClipboardItem не поддерживается, возврат к простому тексту.', e);
      navigator.clipboard.writeText(plainText).then(() => {
        setIsCopied(true);
        setTimeout(() => setIsCopied(false), 2000);
      }).catch(err => {
        console.error('Не удалось скопировать текст: ', err);
      });
    }
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    if (!isDesktop) return;
    e.preventDefault();
    setIsResizing(true);
  };

  const handleMouseUp = useCallback(() => {
    setIsResizing(false);
  }, []);

  const handleMouseMove = useCallback((e: MouseEvent) => {
    if (isDesktop && isResizing && editorPreviewContainerRef.current) {
      const container = editorPreviewContainerRef.current;
      const rect = container.getBoundingClientRect();
      const newWidthPercent = ((e.clientX - rect.left) / rect.width) * 100;
      const clampedWidth = Math.max(20, Math.min(80, newWidthPercent));
      setEditorWidth(clampedWidth);
    }
  }, [isDesktop, isResizing]);
  
  useEffect(() => {
    if (isResizing) {
      document.body.style.cursor = 'col-resize';
      document.body.style.userSelect = 'none';
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
    }
    return () => {
      document.body.style.cursor = '';
      document.body.style.userSelect = '';
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isResizing, handleMouseMove, handleMouseUp]);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const mediaQuery = window.matchMedia('(min-width: 768px)');
    const updateScreenMode = () => {
      setIsDesktop(mediaQuery.matches);
    };

    updateScreenMode();
    if (typeof mediaQuery.addEventListener === 'function') {
      mediaQuery.addEventListener('change', updateScreenMode);
      return () => mediaQuery.removeEventListener('change', updateScreenMode);
    }

    mediaQuery.addListener(updateScreenMode);
    return () => mediaQuery.removeListener(updateScreenMode);
  }, []);

  useEffect(() => {
    if (!isDesktop && isResizing) {
      setIsResizing(false);
    }
  }, [isDesktop, isResizing]);
  
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
        if (e.key === 'Escape' && isPreviewFullscreen) {
            setIsPreviewFullscreen(false);
        }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isPreviewFullscreen]);


  return (
    <div className="flex flex-col min-h-screen font-sans bg-background text-foreground">
      {!isPreviewFullscreen && (
        <header className="pt-8 pb-4 border-b border-border bg-card/80 backdrop-blur-sm z-10 flex-shrink-0">
          <div className="max-w-7xl mx-auto flex flex-col items-center text-center px-4">
              <h1 className="text-4xl font-bold tracking-tight text-foreground">
                Интерактивный Markdown Редактор
              </h1>
              <p className="text-muted-foreground mt-3 max-w-2xl">
                Простой и современный инструмент для написания и предпросмотра Markdown в реальном времени. Просто печатайте в левой панели и мгновенно увидите результат справа.
              </p>
          </div>
           {/* Statistics Dashboard */}
           <div className="max-w-7xl mx-auto mt-6 bg-background/50 border-t border-b border-border py-3 px-4">
              <div className="flex flex-col md:flex-row items-center justify-center gap-4 md:gap-6">
                  <div className="flex flex-wrap items-center justify-center gap-4 md:gap-6 px-2">
                      <StatItem label="Количество слов" value={stats.words} isLarge />
                      <StatItem label="Символов с пробелами" value={stats.charsWithSpaces} isLarge />
                      <StatItem label="Символов Без пробелов" value={stats.charsWithoutSpaces} isLarge />
                  </div>
                  <div className="w-full md:w-auto pt-3 md:pt-0 md:pl-6 border-t md:border-t-0 md:border-l border-border flex flex-wrap items-center justify-center gap-4">
                       {Object.entries(stats.headerCounts)
                          .filter(([, value]) => value > 0)
                          .map(([key, value]) => (
                              <StatItem key={key} label={key.toUpperCase()} value={value} />
                       ))}
                  </div>
             </div>
           </div>
        </header>
      )}

      <main className={`flex-grow flex flex-col gap-4 ${isPreviewFullscreen ? 'p-0' : 'p-4'}`}>
        {/* Editor & Preview Panes with a fixed height */}
        <div ref={editorPreviewContainerRef} className={`flex flex-col md:flex-row items-stretch ${isPreviewFullscreen ? 'flex-grow h-screen' : 'h-auto md:h-[70vh]'}`}>
            {!isPreviewFullscreen && (
              <>
                {/* Markdown Input Panel */}
                <div 
                  className="h-full min-h-[45vh] md:min-h-0 flex flex-col rounded-lg border border-border shadow-sm"
                  style={{ width: isDesktop ? `${editorWidth}%` : '100%', backgroundColor: 'var(--card)' }}
                >
                  <div className="p-3 border-b border-border flex-shrink-0">
                    <h2 className="text-sm font-medium text-card-foreground">Markdown</h2>
                  </div>
                  <textarea
                    value={markdown}
                    onChange={(e) => setMarkdown(e.target.value)}
                    className="flex-grow w-full p-4 resize-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-card font-mono text-sm tracking-tight bg-transparent rounded-b-lg placeholder:text-muted-foreground"
                    placeholder="Напишите ваш Markdown здесь..."
                    aria-label="Markdown Input"
                  />
                </div>

                {/* Resizer */}
                {isDesktop && (
                  <div
                    onMouseDown={handleMouseDown}
                    className="flex-shrink-0 w-6 flex items-center justify-center cursor-col-resize group"
                    aria-label="Resize panels"
                    role="separator"
                    aria-orientation="vertical"
                  >
                      <DragHandleIcon />
                  </div>
                )}
              </>
            )}

            {/* Preview Panel */}
            <div 
              className={`h-full min-h-[45vh] md:min-h-0 flex flex-col shadow-sm overflow-hidden ${isPreviewFullscreen ? 'w-full rounded-none border-none' : 'w-full md:flex-1 rounded-lg border border-border'}`}
              style={{ backgroundColor: 'var(--card)' }}
            >
                <div className="p-3 border-b border-border flex justify-between items-center flex-shrink-0">
                  <h2 className="text-sm font-medium text-card-foreground">Предпросмотр</h2>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={handleCopy}
                      className={`px-3 py-1 text-xs font-medium rounded-md transition-colors ${
                        isCopied
                          ? 'bg-accent text-accent-foreground'
                          : 'bg-secondary text-secondary-foreground hover:bg-muted'
                      }`}
                      aria-label="Скопировать отформатированный текст в буфер обмена"
                    >
                      {isCopied ? 'Скопировано!' : 'Копировать'}
                    </button>
                    <button
                      onClick={() => setIsPreviewFullscreen(p => !p)}
                      className="px-2 py-1 text-xs font-medium rounded-md transition-colors bg-secondary text-secondary-foreground hover:bg-muted"
                      aria-label={isPreviewFullscreen ? "Выйти из полноэкранного режима" : "Перейти в полноэкранный режим"}
                    >
                      {isPreviewFullscreen ? <CollapseIcon /> : <ExpandIcon />}
                    </button>
                  </div>
                </div>
                <div
                  className="flex-grow p-6 overflow-y-auto markdown-body"
                  dangerouslySetInnerHTML={{ __html: renderedHtml }}
                  aria-label="Markdown Preview"
                />
            </div>
        </div>

        {/* Outline Panel */}
        {!isPreviewFullscreen && (
          <div 
            className="flex-shrink-0 flex flex-col rounded-lg border border-border shadow-sm"
            style={{ backgroundColor: 'var(--card)' }}
          >
              <div className="p-3 border-b border-border flex-shrink-0">
                <h2 className="text-sm font-medium text-card-foreground">Структура</h2>
              </div>
              <div className="p-4 text-sm space-y-2">
                {outline.length > 0 ? (
                  outline.map((header, index) => (
                    <div key={index} style={{ paddingLeft: `${(header.level - 1) * 1}rem` }} className="flex items-baseline gap-2 truncate text-muted-foreground hover:text-foreground transition-colors">
                      <span className="flex-shrink-0 font-mono text-xs font-bold text-muted-foreground bg-muted px-1.5 py-0.5 rounded">
                          {`H${header.level}`}
                      </span>
                      <span className="truncate">{header.text}</span>
                    </div>
                  ))
                ) : (
                  <p className="text-muted-foreground italic">Заголовки в документе не найдены.</p>
                )}
              </div>
          </div>
        )}
      </main>
    </div>
  );
}

export default App;
