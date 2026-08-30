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
    // `ui()` bundles @tailwindcss/vite, so that plugin is not registered separately.
    ui({
      autoImport: false,
      // Bundle the icons actually used in source, so nothing is fetched from
      // the Iconify API at runtime.
      icon: { clientBundle: { scan: true } },
      ui: {
        colors: {
          primary: 'primary',
          neutral: 'slate',
        },
        // Replaces the old global `.p-dialog { max-w-[95%] }` rule so narrow
        // screens still get a margin. Per-dialog widths stay on the component.
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
