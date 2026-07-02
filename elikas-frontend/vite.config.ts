import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import svgr from "vite-plugin-svgr";
import tailwindcss from "@tailwindcss/vite";
import path from "path";
import { VitePWA } from "vite-plugin-pwa";
import { visualizer } from "rollup-plugin-visualizer";

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
    svgr(),
    VitePWA({
      registerType: "autoUpdate",
      includeAssets: ["favicon.ico", "apple-touch-icon.png", "robots.txt"],
      manifest: {
        name: "eLikas",
        short_name: "eLikas",
        description:
          "Flood monitoring, hazard reporting, and evacuation management",
        theme_color: "#ffffff",
        background_color: "#ffffff",
        display: "standalone",
        start_url: "/",
        icons: [
          {
            src: "/icon-192x192.png",
            sizes: "192x192",
            type: "image/png",
          },
          {
            src: "/icon-512x512.png",
            sizes: "512x512",
            type: "image/png",
          },
          {
            src: "/icon-512x512.png",
            sizes: "512x512",
            type: "image/png",
            purpose: "maskable",
          },
        ],
      },
      workbox: {
        maximumFileSizeToCacheInBytes: 4000000,
        navigateFallbackDenylist: [/^\/api/, /^\/sanctum/],
        globPatterns: ["**/*.{js,css,html,ico,png,svg,woff2}"],
        runtimeCaching: [
          {
            // Cache API calls from your Laravel backend
            urlPattern: ({ url }) => url.pathname.startsWith("/api"),
            handler: "NetworkFirst",
            options: {
              cacheName: "api-cache",
              expiration: {
                maxEntries: 50,
                maxAgeSeconds: 60 * 60 * 24 * 30,
              },
            },
          },
          {
            // Cache map tiles (Leaflet/OpenStreetMap)
            urlPattern: ({ url }) =>
              url.hostname.includes("tile.openstreetmap.org"),
            handler: "CacheFirst",
            options: {
              cacheName: "map-tiles",
              expiration: {
                maxEntries: 500,
                maxAgeSeconds: 60 * 60 * 24 * 30,
              },
            },
          },
          {
            // Cache static assets
            urlPattern: ({ request }) => request.destination === "image",
            handler: "CacheFirst",
            options: {
              cacheName: "image-cache",
              expiration: {
                maxEntries: 100,
                maxAgeSeconds: 60 * 60 * 24 * 30,
              },
            },
          },
          {
            urlPattern: ({ url }) => url.origin === "http://brouter:17777",
            handler: "CacheFirst",
            options: {
              cacheName: "brouter-cache",
              expiration: {
                maxEntries: 100,
                maxAgeSeconds: 60 * 60 * 24 * 30,
              },
              cacheableResponse: {
                statuses: [0, 200],
              },
            },
          },
        ],
      },
    }),
    visualizer({
      open: true, // auto-opens the report in your browser after build
      gzipSize: true, // shows gzipped size, which is what actually matters over network
      brotliSize: true,
      filename: "dist/stats.html",
    }),
  ],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
});

// interface ImportMetaEnv {
//   readonly VITE_FIREBASE_API_KEY: string;
//   readonly VITE_FIREBASE_AUTH_DOMAIN: string;
//   readonly VITE_FIREBASE_PROJECT_ID: string;
//   readonly VITE_FIREBASE_STORAGE_BUCKET: string;
//   readonly VITE_FIREBASE_MESSAGING_SENDER_ID: string;
//   readonly VITE_FIREBASE_APP_ID: string;
//   readonly VITE_API_BASE_URL: string;
// }

// interface ImportMeta {
//   readonly env: ImportMetaEnv;
// }
