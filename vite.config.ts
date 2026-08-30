import { fileURLToPath, URL } from 'node:url'

import ui from '@nuxt/ui/vite'
import eslint from '@nabla/vite-plugin-eslint'
import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import vueJsx from '@vitejs/plugin-vue-jsx'
import vueDevTools from 'vite-plugin-vue-devtools'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    vue(),
    vueJsx(),
    vueDevTools(),
    ui({
      autoImport: false,
      colorMode: false,
      icon: { clientBundle: { scan: true } },
      ui: {
        colors: {
          primary: 'primary',
          neutral: 'slate',
        },
        modal: {
          slots: {
            content: 'max-w-[95%]',
          },
        },
      },
    }),
    eslint(),
  ],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
  define: {
    __APP_VERSION__: JSON.stringify(process.env.npm_package_version),
  },
})
