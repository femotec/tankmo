import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { VitePWA } from "vite-plugin-pwa";
export default defineConfig(({ mode }) => {
  const nativeBuild = mode === "native";
  const base = nativeBuild ? "/" : process.env.VITE_BASE_PATH || "/";
  if (!base.startsWith("/") || !base.endsWith("/")) {
    throw new Error("VITE_BASE_PATH muss mit / anfangen und enden.");
  }
  return {
    base,
    plugins: [
      react(),
      VitePWA({
        disable: nativeBuild,
        registerType: "prompt",
        includeAssets: ["icons/*.png", "favicon.svg"],
        manifest: {
          name: "Tankmo",
          short_name: "Tankmo",
          description: "Dein persönliches Tankbuch. Privat und offline.",
          lang: "de",
          display: "standalone",
          start_url: base,
          scope: base,
          theme_color: "#1765eb",
          background_color: "#f4f6fa",
          icons: [
            { src: "icons/icon-192.png", sizes: "192x192", type: "image/png" },
            { src: "icons/icon-512.png", sizes: "512x512", type: "image/png" },
            {
              src: "icons/maskable-512.png",
              sizes: "512x512",
              type: "image/png",
              purpose: "maskable",
            },
          ],
        },
        workbox: {
          globPatterns: ["**/*.{js,css,html,png,svg,webmanifest}"],
          navigateFallback: `${base}index.html`,
          cleanupOutdatedCaches: true,
        },
      }),
    ],
    build: {
      outDir: nativeBuild ? "dist-native" : "dist",
      rollupOptions: {
        output: {
          manualChunks: {
            charts: ["recharts"],
            storage: ["dexie", "zod", "papaparse", "decimal.js"],
          },
        },
      },
    },
  };
});
