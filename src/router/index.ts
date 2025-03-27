import { createRouter, createWebHistory } from 'vue-router';

const router = createRouter({
    history: createWebHistory(import.meta.env.BASE_URL),
    scrollBehavior(to, from, savedPosition) {
        if (savedPosition) {
            return savedPosition;
        } else {
            return { top: 0 };
        }
    },
    routes: [
        {
            path: '/',
            name: 'home',
            component: () => import('@/views/HomeView.vue'),
        },
        {
            path: '/movie/:name/:id',
            name: 'detail',
            component: () => import('@/views/DetailView.vue'),
        },
        {
            path: '/login',
            name: 'auth',
            component: () => import('@/views/AuthView.vue'),
        },
    ],
});

export default router;
