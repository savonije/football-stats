import { until } from '@vueuse/core';
import {
    createRouter,
    createWebHistory,
    type RouteLocationRaw,
    type RouteRecordRaw,
} from 'vue-router';

import { auth } from '@/firebase';
import { useSettingsStore } from '@/stores/settingsStore';

declare module 'vue-router' {
    interface RouteMeta {
        title?: string;
        layout?: 'default' | 'blank';
        heading?: { labelKey: string; count?: number };
        breadcrumb?: Array<{
            labelKey: string;
            count?: number;
            to: RouteLocationRaw;
            icon?: string;
        }>;
    }
}

const requireSetting =
    (key: 'washingEnabled' | 'regulationsEnabled') => async () => {
        const settingsStore = useSettingsStore();
        await Promise.all([
            auth.authStateReady(),
            until(() => settingsStore.settingsLoaded).toBe(true),
        ]);
        return settingsStore[key] || !!auth.currentUser || { name: 'home' };
    };

const homeCrumb = [
    {
        labelKey: 'common.homePage',
        to: { name: 'home' },
        icon: 'i-lucide-house',
    },
];

const routes: RouteRecordRaw[] = [
    {
        path: '/',
        name: 'home',
        component: () => import('@/pages/home/index.vue'),
        meta: { title: 'Home', breadcrumb: [] },
    },
    {
        path: '/match/:id',
        name: 'matchDetail',
        component: () => import('@/pages/matches/[id].vue'),
        meta: {
            title: 'Wedstrijddetails',
            breadcrumb: homeCrumb,
        },
    },
    {
        path: '/player/:id',
        name: 'playerDetail',
        component: () => import('@/pages/players/[id].vue'),
        meta: {
            title: 'Spelerdetails',
            breadcrumb: [
                ...homeCrumb,
                {
                    labelKey: 'player.player',
                    count: 2,
                    to: { name: 'players' },
                    icon: 'i-lucide-users',
                },
            ],
        },
    },
    {
        path: '/players',
        name: 'players',
        component: () => import('@/pages/players/index.vue'),
        meta: {
            title: 'Spelers',
            heading: { labelKey: 'player.player', count: 2 },
            breadcrumb: homeCrumb,
        },
    },
    {
        path: '/topscorers',
        name: 'topscorers',
        component: () => import('@/pages/topscorers/index.vue'),
        meta: {
            title: 'Topscorers',
            heading: { labelKey: 'common.topscorers' },
            breadcrumb: homeCrumb,
        },
    },
    {
        path: '/washing',
        name: 'washing',
        component: () => import('@/pages/washing/index.vue'),
        beforeEnter: requireSetting('washingEnabled'),
        meta: {
            title: 'Wasschema',
            heading: { labelKey: 'washing.title' },
            breadcrumb: homeCrumb,
        },
    },
    {
        path: '/training',
        name: 'training',
        component: () => import('@/pages/training/index.vue'),
        meta: {
            title: 'Trainingen',
            heading: { labelKey: 'training.title' },
            breadcrumb: homeCrumb,
        },
    },
    {
        path: '/training/:id',
        name: 'trainingDetail',
        component: () => import('@/pages/training/[id].vue'),
        meta: {
            title: 'Trainingdetails',
            breadcrumb: [
                ...homeCrumb,
                {
                    labelKey: 'training.training',
                    count: 2,
                    to: { name: 'training' },
                    icon: 'i-lucide-calendar',
                },
            ],
        },
    },
    {
        path: '/regulations',
        name: 'regulations',
        component: () => import('@/pages/regulations/index.vue'),
        beforeEnter: requireSetting('regulationsEnabled'),
        meta: {
            title: 'Regels & afspraken',
            heading: { labelKey: 'regulations.title' },
            breadcrumb: homeCrumb,
        },
    },
    {
        path: '/login',
        name: 'auth',
        component: () => import('@/pages/login/index.vue'),
        meta: { title: 'Login', layout: 'blank' },
    },
];

const router = createRouter({
    history: createWebHistory(import.meta.env.BASE_URL),
    scrollBehavior(to, from, savedPosition) {
        if (savedPosition) return savedPosition;
        return { top: 0 };
    },
    routes,
});

export default router;
