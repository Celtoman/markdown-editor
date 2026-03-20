import { type CSSProperties, type RefObject } from "react";
import { Trash2 } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type MarkdownEditorPaneProps = {
  markdown: string;
  onMarkdownChange: (nextValue: string) => void;
  onClear: () => void;
  textareaRef: RefObject<HTMLTextAreaElement | null>;
  textareaClassName: string;
  onScroll?: () => void;
  className?: string;
  style?: CSSProperties;
  showWordBadge?: boolean;
  wordCount?: number;
};

export const MarkdownEditorPane = ({
  markdown,
  onMarkdownChange,
  onClear,
  textareaRef,
  textareaClassName,
  onScroll,
  className,
  style,
  showWordBadge = false,
  wordCount = 0,
}: MarkdownEditorPaneProps) => {
  return (
    <div
      className={cn("overflow-hidden rounded-2xl border bg-card", className)}
      style={style}
    >
      <div className="flex h-14 items-center justify-between border-b px-4">
        <h2 className="text-sm font-semibold">Редактор Markdown</h2>
        <div className="flex items-center gap-2">
          {showWordBadge ? <Badge variant="outline">{wordCount} слов</Badge> : null}
          <Button variant="outline" size="sm" onClick={onClear}>
            <Trash2 className="h-4 w-4" />
            Очистить
          </Button>
        </div>
      </div>
      <textarea
        ref={textareaRef}
        value={markdown}
        onChange={(event) => onMarkdownChange(event.target.value)}
        onScroll={onScroll}
        className={textareaClassName}
        placeholder="Пиши Markdown здесь…"
        aria-label="Поле ввода Markdown"
        name="markdown"
        autoComplete="off"
        spellCheck={false}
        autoCapitalize="off"
        autoCorrect="off"
      />
    </div>
  );
};
