import {
    createRouter,
    createWebHistory,
    type RouteLocationRaw,
} from 'vue-router';

declare module 'vue-router' {
    interface RouteMeta {
        title?: string;
        breadcrumb?: Array<{
            labelKey: string;
            count?: number;
            to: RouteLocationRaw;
            icon?: string;
        }>;
    }
}

const routes = [
    {
        path: '/',
        name: 'home',
        component: () => import('@/views/HomeView.vue'),
        meta: { title: "Home - Apollo '69" },
    },
    {
        path: '/match/:id',
        name: 'matchDetail',
        component: () => import('@/views/MatchView.vue'),
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
        component: () => import('@/views/PlayerView.vue'),
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
        component: () => import('@/views/PlayersView.vue'),
        meta: { title: "Spelers - Apollo '69" },
    },
    {
        path: '/topscorers',
        name: 'topscorers',
        component: () => import('@/views/TopScorersView.vue'),
        meta: { title: "Topscorers - Apollo '69" },
    },
    {
        path: '/washing',
        name: 'washing',
        component: () => import('@/views/WashingView.vue'),
        meta: { title: "Wasschema - Apollo '69" },
    },
    {
        path: '/training',
        name: 'training',
        component: () => import('@/views/TrainingView.vue'),
        meta: { title: "Trainingen - Apollo '69" },
    },
    {
        path: '/training/:id',
        name: 'trainingDetail',
        component: () => import('@/views/TrainingDetailView.vue'),
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
        component: () => import('@/views/AuthView.vue'),
        meta: { title: "Login -  Apollo '69" },
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
