import { createI18n } from 'vue-i18n'

import nl from '@/lang/nl'

export default createI18n<[typeof nl], 'nl'>({
  warnHtmlMessage: false,
  fallbackLocale: 'nl',
  globalInjection: true,
  legacy: false,
  locale: 'nl',
  messages: {
    nl,
  },
})
