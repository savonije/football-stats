import { createRouter, createWebHistory } from 'vue-router'

const routes = [
  {
    path: '/',
    name: 'home',
    component: () => import('@/views/HomeView.vue'),
    meta: { title: "Home - Apollo '69 JO9" },
  },

  {
    path: '/match/:id',
    name: 'matchDetail',
    component: () => import('@/views/MatchView.vue'),
    meta: { title: "Wedstrijddetails - Apollo '69 JO9" },
  },
]

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  scrollBehavior(to, from, savedPosition) {
    if (savedPosition) return savedPosition
    return { top: 0 }
  },
  routes,
})

export default router
