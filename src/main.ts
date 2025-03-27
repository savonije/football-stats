import './assets/main.css'

import { createPinia } from 'pinia';
import { createApp, markRaw } from 'vue';
import App from './App.vue'
import router from './router'
import type { Router } from 'vue-router';

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

app.mount('#app');
