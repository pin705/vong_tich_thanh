// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  compatibilityDate: '2025-07-15',
  devtools: { enabled: false },
  ssr: false,
  modules: [
    // '@nuxtjs/tailwindcss',
    'nuxt-mongoose',
    'nuxt-auth-utils',
    '@vite-pwa/nuxt'
  ],

  mongoose: {
    uri: process.env.MONGODB_URI || 'mongodb://localhost:27017/vong_tich_thanh',
    options: {},
    modelsDir: 'models'
  },

  nitro: {
    experimental: {
      websocket: true
    }
  },

  runtimeConfig: {
    session: {
      cookie: {
        secure: false, // Chỉ dùng secure cookie trong production (HTTPS)
        sameSite: "lax", // Hoặc 'none' nếu cần truy cập cross-site
      },
    },
  },

  css: ['~/assets/css/terminal.css'],

  // PWA Configuration
  pwa: {
    registerType: 'autoUpdate',
    manifest: {
      name: 'Vong Tích Thành - MUD Game',
      short_name: 'Vong Tích Thành',
      description: 'A classic text-based MUD (Multi-User Dungeon) game with a retro terminal aesthetic',
      theme_color: '#000000',
      background_color: '#000000',
      display: 'standalone',
      orientation: 'portrait',
      scope: '/',
      start_url: '/',
      icons: [
        {
          src: '/icon-192x192.png',
          sizes: '192x192',
          type: 'image/png'
        },
        {
          src: '/icon-512x512.png',
          sizes: '512x512',
          type: 'image/png'
        },
        {
          src: '/icon-512x512.png',
          sizes: '512x512',
          type: 'image/png',
          purpose: 'any maskable'
        }
      ]
    },
    workbox: {
      navigateFallback: '/',
      globPatterns: ['**/*.{js,css,html,png,svg,ico}'],
      cleanupOutdatedCaches: true,
      runtimeCaching: [
        {
          urlPattern: /^https:\/\/fonts\.googleapis\.com\/.*/i,
          handler: 'CacheFirst',
          options: {
            cacheName: 'google-fonts-cache',
            expiration: {
              maxEntries: 10,
              maxAgeSeconds: 60 * 60 * 24 * 365 // 1 year
            },
            cacheableResponse: {
              statuses: [0, 200]
            }
          }
        },
        {
          urlPattern: /^https:\/\/fonts\.gstatic\.com\/.*/i,
          handler: 'CacheFirst',
          options: {
            cacheName: 'gstatic-fonts-cache',
            expiration: {
              maxEntries: 10,
              maxAgeSeconds: 60 * 60 * 24 * 365 // 1 year
            },
            cacheableResponse: {
              statuses: [0, 200]
            }
          }
        }
      ]
    },
    client: {
      installPrompt: true,
      periodicSyncForUpdates: 3600 // Check for updates every hour
    },
    devOptions: {
      enabled: false,
      type: 'module'
    }
  },

  app: {
    head: {
      htmlAttrs: {
        lang: 'vi'
      },
      title: 'Vong Tích Thành - MUD Game',
      titleTemplate: '%s | Vong Tích Thành',
      meta: [
        { charset: 'utf-8' },
        { name: 'viewport', content: 'width=device-width, initial-scale=1' },
        { 
          name: 'description', 
          content: 'Vong Tích Thành là một trò chơi MUD (Multi-User Dungeon) văn bản cổ điển với giao diện terminal retro. Khám phá thế giới, chiến đấu với quái vật, nâng cấp nhân vật và giao lưu với người chơi khác trong thời gian thực.'
        },
        { name: 'format-detection', content: 'telephone=no' },
        { name: 'theme-color', content: '#000000' },
        { name: 'apple-mobile-web-app-capable', content: 'yes' },
        { name: 'apple-mobile-web-app-status-bar-style', content: 'black' },
        { name: 'apple-mobile-web-app-title', content: 'Vong Tích Thành' },
        
        // Open Graph / Facebook
        { property: 'og:type', content: 'website' },
        { property: 'og:url', content: 'https://vongtichthanh.com/' },
        { property: 'og:title', content: 'Vong Tích Thành - MUD Game' },
        { property: 'og:description', content: 'Trò chơi MUD văn bản cổ điển với giao diện terminal retro. Khám phá, chiến đấu và giao lưu trong thế giới văn bản đầy màu sắc.' },
        { property: 'og:image', content: '/og-image.png' },
        { property: 'og:image:width', content: '1200' },
        { property: 'og:image:height', content: '630' },
        { property: 'og:locale', content: 'vi_VN' },
        
        // Twitter
        { name: 'twitter:card', content: 'summary_large_image' },
        { name: 'twitter:url', content: 'https://vongtichthanh.com/' },
        { name: 'twitter:title', content: 'Vong Tích Thành - MUD Game' },
        { name: 'twitter:description', content: 'Trò chơi MUD văn bản cổ điển với giao diện terminal retro' },
        { name: 'twitter:image', content: '/og-image.png' },
        
        // Keywords
        { name: 'keywords', content: 'MUD game, text-based game, retro game, terminal game, multiplayer game, Vietnamese game, Vong Tích Thành, trò chơi văn bản, game retro' },
        { name: 'author', content: 'Vong Tích Thành Team' },
        { name: 'robots', content: 'index, follow' }
      ],
      link: [
        { rel: 'icon', type: 'image/x-icon', href: '/favicon.ico' },
        { rel: 'apple-touch-icon', sizes: '180x180', href: '/apple-touch-icon.png' },
        { rel: 'icon', type: 'image/png', sizes: '32x32', href: '/favicon-32x32.png' },
        { rel: 'icon', type: 'image/png', sizes: '16x16', href: '/favicon-16x16.png' },
        { rel: 'manifest', href: '/site.webmanifest' },
        {
          rel: 'preconnect',
          href: 'https://fonts.googleapis.com'
        },
        {
          rel: 'preconnect',
          href: 'https://fonts.gstatic.com',
          crossorigin: ''
        },
        {
          rel: 'stylesheet',
          href: 'https://fonts.googleapis.com/css2?family=VT323&family=Source+Code+Pro:wght@400;700&display=swap'
        }
      ]
    }
  }
})
