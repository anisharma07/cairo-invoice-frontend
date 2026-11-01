import react from "@vitejs/plugin-react";
import { defineConfig, loadEnv, type Plugin } from "vite";
// @ts-ignore - plain JS serverless handler shared with Vercel
import { pinToIpfs } from "./api/ipfs/pin.js";

/** Serves /api/ipfs/pin during `vite dev`, mirroring the Vercel function. */
function localApi(env: Record<string, string>): Plugin {
  return {
    name: "local-api",
    configureServer(server) {
      server.middlewares.use("/api/ipfs/pin", (req, res) => {
        const send = (status: number, json: unknown) => {
          res.statusCode = status;
          res.setHeader("Content-Type", "application/json");
          res.end(JSON.stringify(json));
        };
        if (req.method !== "POST") return send(405, { error: "POST only" });
        let raw = "";
        req.on("data", (c) => (raw += c));
        req.on("end", async () => {
          try {
            const result = await pinToIpfs(JSON.parse(raw || "{}"), env);
            send(result.status, result.json);
          } catch (e) {
            send(500, { error: String(e) });
          }
        });
      });
    },
  };
}
import { VitePWA } from "vite-plugin-pwa";

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  plugins: [
    localApi(loadEnv(mode, process.cwd(), "")),
    react(),
    VitePWA({ 
      registerType: "autoUpdate",
      workbox: {
        globPatterns: ['**/*.{js,css,html,ico,png,svg,json,txt,woff2}'],
        // The app bundle is ~4 MB; it must be precached for offline use.
        maximumFileSizeToCacheInBytes: 8 * 1024 * 1024,
        navigateFallbackDenylist: [/^\/api\//],
        runtimeCaching: [
          {
            urlPattern: /^https:\/\/api\./,
            handler: 'NetworkFirst',
            options: {
              cacheName: 'api-cache',
              expiration: {
                maxEntries: 50,
                maxAgeSeconds: 5 * 60, // 5 minutes
              },
            },
          },
          {
            urlPattern: /.*\.(?:png|jpg|jpeg|svg|gif|webp)/,
            handler: 'CacheFirst',
            options: {
              cacheName: 'images-cache',
              expiration: {
                maxEntries: 100,
                maxAgeSeconds: 30 * 24 * 60 * 60, // 30 days
              },
            },
          },
        ],
        skipWaiting: true,
        clientsClaim: true
      },
      manifest: {
        name: 'Cairo Invoice: Proof-of-Invoice on Starknet',
        short_name: 'Cairo Invoice',
        description: 'Offline-first invoicing with tamper-evident records anchored on Starknet and IPFS.',
        theme_color: '#1d1d6e',
        background_color: '#ffffff',
        display: 'standalone',
        orientation: 'portrait-primary',
        scope: '/',
        start_url: '/',
        icons: [
          {
            src: 'pwa-192x192.png',
            sizes: '192x192',
            type: 'image/png',
            purpose: 'any'
          },
          {
            src: 'pwa-512x512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'any'
          },
          {
            src: 'maskable-icon-512x512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'maskable'
          }
        ]
      },
      devOptions: {
        enabled: false // Disable in dev to avoid conflicts
      }
    })
  ],
  define: {
    __DATE__: `'${new Date().toISOString()}'`,
    global: 'globalThis',
  },
  build: {
    target: "es2020",
    minify: "esbuild",
    sourcemap: false
  },
  esbuild: {
    target: "es2020",
  },
  optimizeDeps: {
    esbuildOptions: {
      target: "es2020",
    },
  },
}));
