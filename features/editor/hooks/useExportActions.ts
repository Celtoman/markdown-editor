import { useCallback, useState } from "react";

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

type UseExportActionsArgs = {
  markdown: string;
  renderedHtml: string;
};

export const useExportActions = ({
  markdown,
  renderedHtml,
}: UseExportActionsArgs) => {
  const [isExportingPdf, setIsExportingPdf] = useState(false);

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

  return {
    isExportingPdf,
    handleExportMarkdown,
    handleExportHtml,
    handleExportPdf,
  };
};
