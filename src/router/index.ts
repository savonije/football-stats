import {
    createRouter,
    createWebHistory,
    type RouteLocationRaw,
    type RouteRecordRaw,
} from 'vue-router';

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

const routes: RouteRecordRaw[] = [
    {
        path: '/',
        name: 'home',
        component: () => import('@/pages/home/index.vue'),
        meta: { title: "Home - Apollo '69" },
    },
    {
        path: '/match/:id',
        name: 'matchDetail',
        component: () => import('@/pages/matches/[id].vue'),
        meta: {
            title: "Wedstrijddetails - Apollo '69",
            breadcrumb: [
                {
                    labelKey: 'match.game',
                    count: 2,
                    to: { name: 'home' },
                    icon: 'pi pi-home',
                },
            ],
        },
    },
    {
        path: '/player/:id',
        name: 'playerDetail',
        component: () => import('@/pages/players/[id].vue'),
        meta: {
            title: "Spelerdetails - Apollo '69",
            breadcrumb: [
                {
                    labelKey: 'player.player',
                    count: 2,
                    to: { name: 'players' },
                    icon: 'pi pi-users',
                },
            ],
        },
    },
    {
        path: '/players',
        name: 'players',
        component: () => import('@/pages/players/index.vue'),
        meta: {
            title: "Spelers - Apollo '69",
            heading: { labelKey: 'player.player', count: 2 },
        },
    },
    {
        path: '/topscorers',
        name: 'topscorers',
        component: () => import('@/pages/topscorers/index.vue'),
        meta: {
            title: "Topscorers - Apollo '69",
            heading: { labelKey: 'common.topscorers' },
        },
    },
    {
        path: '/washing',
        name: 'washing',
        component: () => import('@/pages/washing/index.vue'),
        meta: {
            title: "Wasschema - Apollo '69",
            heading: { labelKey: 'washing.title' },
        },
    },
    {
        path: '/training',
        name: 'training',
        component: () => import('@/pages/training/index.vue'),
        meta: {
            title: "Trainingen - Apollo '69",
            heading: { labelKey: 'training.title' },
        },
    },
    {
        path: '/training/:id',
        name: 'trainingDetail',
        component: () => import('@/pages/training/[id].vue'),
        meta: {
            title: "Trainingdetails - Apollo '69",
            breadcrumb: [
                {
                    labelKey: 'training.training',
                    count: 2,
                    to: { name: 'training' },
                    icon: 'pi pi-calendar',
                },
            ],
        },
    },
    {
        path: '/login',
        name: 'auth',
        component: () => import('@/pages/login/index.vue'),
        meta: { title: "Login -  Apollo '69", layout: 'blank' },
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
