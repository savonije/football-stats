import '@/styles/main.css';
import '@/config/dayjs';

import ui from '@nuxt/ui/vue-plugin';
import { createPinia } from 'pinia';
import { createApp, markRaw } from 'vue';
import type { Router } from 'vue-router';

import App from '@/App.vue';

import i18n from '@/config/i18n';
import { CLUBNAME } from '@/constants';
import router from '@/router';

declare module 'pinia' {
    export interface PiniaCustomProperties {
        router: Router;
    }
}

const pinia = createPinia();

pinia.use(({ store }) => {
    store.router = markRaw(router);
});

const app = createApp(App);

app.use(ui);
app.use(i18n);
app.use(router);
app.use(pinia);

router.afterEach((to) => {
    document.title = to.meta.title
        ? `${to.meta.title} - ${CLUBNAME}`
        : CLUBNAME;
});

app.mount('#app');
