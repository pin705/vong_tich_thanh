// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  compatibilityDate: '2025-07-15',
  devtools: { enabled: true },
  
  modules: [
    '@nuxtjs/tailwindcss',
    'nuxt-mongoose',
    'nuxt-auth-utils'
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

  css: ['~/assets/css/terminal.css'],

  app: {
    head: {
      title: 'Vong Tích Thành',
      link: [
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
