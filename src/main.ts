import '@/styles/main.css'
import '@/config/dayjs'

import { createApp } from 'vue'
import App from '@/App.vue'
import Aura from '@primeuix/themes/aura'
import router from '@/router'
import { definePreset } from '@primeuix/themes'
import { theme } from '@/utils/tailwind'
import i18n from '@/config/i18n'
import { Config, ToastService } from 'primevue'
import { createPinia } from 'pinia'

const pinia = createPinia()

const app = createApp(App)

const CustomPreset = definePreset(Aura, {
  semantic: {
    primary: {
      50: theme('--color-primary-50'),
      100: theme('--color-primary-100'),
      200: theme('--color-primary-200'),
      300: theme('--color-primary-300'),
      400: theme('--color-primary-400'),
      500: theme('--color-primary-500'),
      600: theme('--color-primary-600'),
      700: theme('--color-primary-700'),
      800: theme('--color-primary-800'),
      900: theme('--color-primary-900'),
    },
  },
})

app.use(Config, {
  theme: {
    options: {
      darkModeSelector: false,
    },
    preset: CustomPreset,
  },
})

app.use(ToastService)
app.use(i18n)
app.use(router)
app.use(pinia)

app.mount('#app')
