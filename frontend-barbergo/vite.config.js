import tailwindcss from '@tailwindcss/vite'
import { VitePWA } from 'vite-plugin-pwa';
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss(), VitePWA({
    registerType: 'autoUpdate',
    injectRegister: false,

    pwaAssets: {
      disabled: false,
      config: true,
    },

    manifest: {
      name: 'BarberGo',
      short_name: 'BarberGo',
      description: 'Agenda citas en barberías',
      theme_color: '#FBF7F2',
      background_color: '#FBF7F2',
      display: 'standalone',
      lang: 'es',
    },

    workbox: {
      globPatterns: ['**/*.{js,css,html,svg,png,ico}'],
      cleanupOutdatedCaches: true,
      clientsClaim: true,
    },

    devOptions: {
      enabled: false,
      navigateFallback: 'index.html',
      suppressWarnings: true,
      type: 'module',
    },
  })],
  server: {
    proxy: {
      '/api': 'http://localhost:3000',
    },
  },
})