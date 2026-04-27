<script setup lang="ts">
import { ref, onMounted } from 'vue'
import Button from 'primevue/button'
import Select from 'primevue/select'
import { useI18n } from 'vue-i18n'

import { useSeasonStore } from '@/stores/seasonStore'

import NavDrawer from '@/components/NavDrawer.vue'

import { CLUBNAME, TEAMNAME } from '@/constants'

const seasonStore = useSeasonStore()
const { t } = useI18n()

const navDrawer = ref<InstanceType<typeof NavDrawer>>()

onMounted(() => {
  seasonStore.fetchSeasons()
})
</script>

<template>
  <header class="header-root sticky top-0 z-50 text-white py-3 sm:p-3 sm:py-5 mb-12">
    <div class="container flex items-center justify-between gap-6 relative z-10">
      <div class="flex items-center gap-4">
        <Router-Link :to="{ name: 'home' }" class="logo-link hidden lg:flex">
          <img src="/images/logo.webp" :alt="`${CLUBNAME} ${TEAMNAME} logo`" class="max-h-14" />
        </Router-Link>

        <div>
          <Router-Link :to="{ name: 'home' }">
            <h1 class="text-xl lg:text-3xl text-white mb-0 font-black tracking-tight">
              {{ CLUBNAME }}
              <span class="text-primary-300 font-thin mx-1">|</span>
              <span class="text-primary-200 font-semibold">{{ TEAMNAME }}</span>
            </h1>
          </Router-Link>
          <Select
            v-if="seasonStore.seasonsLoaded"
            :model-value="seasonStore.currentSeason"
            :options="seasonStore.seasons"
            size="small"
            class="text-xs! mt-1"
            disabled
            @update:model-value="seasonStore.setSeason"
          />
          <span v-else class="text-white/70 text-xs">{{ seasonStore.currentSeason }}</span>
        </div>
      </div>

      <Button
        icon="pi pi-bars"
        class="text-white! hover:text-primary-300! hover:bg-white/10!"
        text
        rounded
        :aria-label="t('common.menu')"
        @click="navDrawer?.open()"
      />
    </div>
  </header>

  <NavDrawer ref="navDrawer" />
</template>

<style scoped>
.header-root {
  background: linear-gradient(
    135deg,
    #111a36 0%,
    #1d2e5d 30%,
    #27428a 60%,
    #2f529f 80%,
    #4067b9 100%
  );
  box-shadow:
    0 4px 24px rgba(17, 26, 54, 0.45),
    0 1px 0 rgba(255, 255, 255, 0.07) inset;
  position: relative;
  overflow: hidden;
}

/* Diagonal pitch-stripe texture overlay */
.header-root::before {
  content: '';
  position: absolute;
  inset: 0;
  background: repeating-linear-gradient(
    -55deg,
    transparent,
    transparent 20px,
    rgba(255, 255, 255, 0.018) 20px,
    rgba(255, 255, 255, 0.018) 40px
  );
  pointer-events: none;
  z-index: 0;
}

.logo-link img {
  transition:
    filter 0.3s ease,
    transform 0.3s ease;
}

.logo-link:hover img {
  filter: drop-shadow(0 0 10px rgba(96, 133, 209, 0.85));
  transform: scale(1.05) rotate(-1deg);
}

@keyframes header-shimmer {
  0% {
    transform: translateX(-120%) skewX(-20deg);
    opacity: 0;
  }
  10% {
    opacity: 1;
  }
  90% {
    opacity: 1;
  }
  100% {
    transform: translateX(280%) skewX(-20deg);
    opacity: 0;
  }
}
</style>
