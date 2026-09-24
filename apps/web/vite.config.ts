import { resolve } from 'node:path';
import react from '@vitejs/plugin-react';
import { defineConfig } from 'vitest/config';
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'prompt',
      includeAssets: ['favicon.svg', 'apple-touch-icon.png'],
      manifest: {
        name: 'GasteMenos',
        short_name: 'GasteMenos',
        description: 'Leia a nota fiscal e veja para onde vai o seu dinheiro.',
        lang: 'pt-BR',
        start_url: '/',
        display: 'standalone',
        // Cores do design system: brand e surface no tema claro.
        theme_color: '#0E4D3A',
        background_color: '#F5F3EC',
        icons: [
          { src: 'icone-192.png', sizes: '192x192', type: 'image/png' },
          { src: 'icone-512.png', sizes: '512x512', type: 'image/png' },
          { src: 'icone-512-mascara.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
        ],
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,svg,png,woff2}'],
        runtimeCaching: [
          {
            // O Início precisa abrir sem rede mostrando o que já estava salvo
            // (docs/02-ARQUITETURA.md). Rede primeiro, cache como rede de apoio.
            urlPattern: ({ url }) => url.pathname.startsWith('/v1/'),
            handler: 'NetworkFirst',
            options: {
              cacheName: 'api',
              networkTimeoutSeconds: 4,
              expiration: { maxEntries: 120, maxAgeSeconds: 60 * 60 * 24 },
              cacheableResponse: { statuses: [0, 200] },
            },
          },
        ],
      },
      devOptions: { enabled: false },
    }),
  ],
  resolve: {
    alias: { '@': resolve(import.meta.dirname, 'src') },
  },
  server: {
    // Bind explicito em IPv4: no Windows 'localhost' resolve para ::1 primeiro,
    // e Playwright/curl em 127.0.0.1 nao acham o servidor.
    host: '127.0.0.1',
    port: 5173,
    proxy: {
      // O web fala com a API pelo mesmo endereço em desenvolvimento, para o
      // cookie de refresh (SameSite=Lax) funcionar como funciona em produção.
      '/v1': {
        target: process.env.API_URL ?? 'http://127.0.0.1:3001',
        changeOrigin: true,
      },
    },
  },
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./src/teste/preparar.ts'],
    include: ['src/**/*.{test,a11y.test}.{ts,tsx}'],
    css: true,
  },
});
