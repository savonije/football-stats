import './assets/main.css';

import router from './router';
import { createPinia } from 'pinia';
import { createApp, markRaw } from 'vue';
import type { Router } from 'vue-router';

import i18n from '@/config/i18n';

import App from './App.vue';

declare module 'pinia' {
    export interface PiniaCustomProperties {
        router: Router;
    }
}

const pinia = createPinia();

const app = createApp(App);

pinia.use(({ store }) => {
    store.router = markRaw(router);
});

app.use(router);
app.use(pinia);
app.use(i18n);

app.mount('#app');
