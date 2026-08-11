import { fileURLToPath, URL } from "node:url";
// vitest/config's defineConfig merges Vite's own options with the
// `test` block's typing — a drop-in replacement for vite's defineConfig
// in a single shared config file, not a second build tool bolted on.
import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import { tanstackRouter } from "@tanstack/router-plugin/vite";
import { VitePWA } from "vite-plugin-pwa";

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    // Must run before @vitejs/plugin-react — generates the typed route
    // tree from src/routes before React's Babel/SWC transform sees it.
    tanstackRouter({
      target: "react",
      autoCodeSplitting: true,
      routesDirectory: "./src/routes",
      generatedRouteTree: "./src/routeTree.gen.ts",
    }),
    react(),
    tailwindcss(),
    VitePWA({
      registerType: "prompt",
      includeAssets: ["favicon.svg"],
      manifest: {
        name: "LIMS",
        short_name: "LIMS",
        description: "Livestock Inventory Management System",
        theme_color: "#1B3A2F",
        background_color: "#FAF8F4",
        display: "standalone",
        orientation: "portrait",
        start_url: "/",
        // Placeholder mark only — real app icons (192/512 PNG + maskable)
        // are a design task, not a Session 0 concern. Swap these out
        // when the icon set exists; don't ship to production on an SVG
        // manifest icon alone.
        icons: [{ src: "favicon.svg", sizes: "any", type: "image/svg+xml" }],
      },
      workbox: {
        globPatterns: ["**/*.{js,css,html,ico,png,svg,woff2}"],
      },
    }),
  ],
  resolve: {
    alias: {
      "@": fileURLToPath(new URL("./src", import.meta.url)),
    },
  },
  test: {
    environment: "jsdom",
    // fake-indexeddb's auto side-effecting import — lib/offline/db.ts's
    // Dexie database needs a real IndexedDB implementation to open at
    // all, which jsdom itself doesn't provide.
    setupFiles: ["fake-indexeddb/auto"],
  },
});
