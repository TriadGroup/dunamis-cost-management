import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      injectRegister: 'auto',
      devOptions: {
        enabled: true // Allows testing PWA offline in dev server
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,ico,png,svg}'] // Cache all essential files
      },
      includeAssets: ['favicon.ico', 'apple-touch-icon.png', 'mask-icon.svg', 'dunamis-logo.png'],
      manifest: {
        name: 'Farm Ops',
        short_name: 'Farm Ops',
        description: 'Gestão de equipes missionárias em campo',
        theme_color: '#0a0e08',
        background_color: '#0f1410',
        display: 'standalone',
        icons: [
          {
            src: 'pwa-192x192.png',
            sizes: '192x192',
            type: 'image/png'
          },
          {
            src: 'pwa-512x512.png',
            sizes: '512x512',
            type: 'image/png'
          }
        ]
      }
    })
  ],
})
