import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'
import basicSsl from '@vitejs/plugin-basic-ssl'

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  // Load env file based on `mode` in the current working directory.
  // Set the third parameter to '' to load all env vars regardless of the `VITE_` prefix.
  const env = loadEnv(mode, process.cwd(), '');
  
  // Derive backend URL for the proxy. 
  // If VITE_API_URL is empty, we construct a local target from the port.
  // This ensures the dev server never crashes and proxy is always ready.
  const backendPort = env.VITE_BACKEND_PORT || '5002';
  const proxyTarget = env.VITE_API_URL || `http://127.0.0.1:${backendPort}`;

  return {
    plugins: [
      react(),
      basicSsl(),
      // Custom plugin to silence benign source map errors from extensions (React DevTools)
      {
        name: 'source-map-silencer',
        configureServer(server) {
          server.middlewares.use((req, res, next) => {
            if (req.url?.endsWith('.map')) {
              res.statusCode = 404;
              res.end('Source map not found');
              return;
            }
            next();
          });
        }
      },
      VitePWA({
        registerType: 'autoUpdate',
        includeAssets: ['favicon.ico', 'robots.txt', 'apple-touch-icon.png'],
        manifest: {
          name: 'SOEMS - Smart Online Exam Management System',
          short_name: 'SOEMS',
          description: 'Secure and Intelligent Online Examination Platform',
          theme_color: '#0f172a',
          background_color: '#0f172a',
          display: 'standalone',
          start_url: '/',
          icons: [
            {
              src: 'pwa-192x192.png',
              sizes: '192x192',
              type: 'image/png',
              purpose: 'any maskable'
            },
            {
              src: 'pwa-512x512.png',
              sizes: '512x512',
              type: 'image/png',
              purpose: 'any maskable'
            }
          ]
        },
        workbox: {
          navigateFallback: '/index.html',
          globPatterns: ['**/*.{js,css,html,ico,png,svg,woff2}'],
          maximumFileSizeToCacheInBytes: 5 * 1024 * 1024 // 5 MB
        }
      })
    ],
    server: {
      port: 5173,
      host: true,
      proxy: {
        '/api': {
          target: proxyTarget,
          changeOrigin: true,
        },
        '/socket.io': {
          target: proxyTarget,
          ws: true,
          secure: false, // Essential for self-signed certificates on local IP connections
          changeOrigin: true,
        }
      },
    },
    build: {
      rollupOptions: {
        output: {
          manualChunks(id) {
            if (id.includes('node_modules')) {
              if (id.includes('recharts')) return 'vendor-charts';
              if (id.includes('jspdf') || id.includes('html2canvas')) return 'vendor-export';
              if (id.includes('framer-motion')) return 'vendor-animation';
              if (id.includes('lucide-react')) return 'vendor-icons';
              if (id.includes('tensorflow') || id.includes('tfjs')) return 'vendor-ai-core';
              if (id.includes('vladmandic')) return 'vendor-ai-face';
              return 'vendor'; // all other node_modules
            }
          }
        }
      },
      chunkSizeWarningLimit: 1000,
    }
  };
})
