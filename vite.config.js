import { resolve } from "node:path";
import { defineConfig } from "vite";

// Two pages: landing (/) and the dashboard (/app)
export default defineConfig({
  build: {
    target: "es2022",
    chunkSizeWarningLimit: 700, // three.js is large by nature
    rollupOptions: {
      input: {
        main: resolve(import.meta.dirname, "index.html"),
        app: resolve(import.meta.dirname, "app.html"),
      },
    },
  },
});
