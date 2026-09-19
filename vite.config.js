import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['icons/icon-192.png', 'icons/icon-512.png'],
      manifest: {
        name: 'TERAS DELIVERY',
        short_name: 'TERAS',
        description: 'PESAN, PROSES, HAPPY!',
        theme_color: '#1E5AA8',
        background_color: '#F5F8FC',
        display: 'standalone',
        start_url: '/',
        icons: [
          { src: '/icons/icon-192.png', sizes: '192x192', type: 'image/png' },
          { src: '/icons/icon-512.png', sizes: '512x512', type: 'image/png' }
        ]
      },
      workbox: {
        // App shell dicache, tapi transaksi/data tetap harus lewat Firebase (online).
        globPatterns: ['**/*.{js,css,html,svg,png,ico}'],
        navigateFallbackDenylist: [/^\/api/],
        // Tanpa ini, versi baru "menunggu" semua tab lama ditutup dulu sebelum
        // aktif -- membuat update terasa tidak langsung berubah walau sudah
        // di-deploy. skipWaiting + clientsClaim membuat tab yang terbuka
        // langsung dikuasai versi baru begitu selesai di-download.
        skipWaiting: true,
        clientsClaim: true
      }
    })
  ],
  server: { port: 5173 }
});
