import { fileURLToPath, URL } from "node:url";
import { defineConfig } from "vite";
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
});
