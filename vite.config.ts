import path from "path";
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  server: {
    port: 3000,
    host: "0.0.0.0",
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (!id.includes("node_modules")) {
            return;
          }

          if (id.includes("html2pdf.js")) {
            return "export-pdf";
          }

          if (
            id.includes("/marked/") ||
            id.includes("/marked-highlight/") ||
            id.includes("/highlight.js/") ||
            id.includes("/dompurify/")
          ) {
            return "markdown-core";
          }

          if (id.includes("/lucide-react/")) {
            return "ui-icons";
          }
        },
      },
    },
  },
  plugins: [react()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "."),
    },
  },
});
