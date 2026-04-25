<script setup lang="ts">
import { onMounted } from 'vue'
import { useToast } from 'primevue'
import Button from 'primevue/button'
import Select from 'primevue/select'

import { useStoreAuth } from '@/stores/authStore'
import { useSeasonStore } from '@/stores/seasonStore'

import { CLUBNAME, TEAMNAME } from '@/constants'

const storeAuth = useStoreAuth()
const seasonStore = useSeasonStore()
const toast = useToast()

onMounted(() => {
  seasonStore.fetchSeasons()
})
</script>

<template>
  <header class="bg-primary text-white py-3 sm:p-3 sm:py-6">
    <div class="container flex items-center justify-between gap-6">
      <div class="flex items-center gap-3">
        <Router-Link :to="{ name: 'home' }" variant="text">
          <img
            src="/images/logo.webp"
            :alt="`${CLUBNAME} ${TEAMNAME} logo`"
            class="max-h-16 hidden lg:block"
          />
        </Router-Link>

        <div>
          <Router-Link :to="{ name: 'home' }" variant="text">
            <h1 class="text-lg lg:text-2xl text-white mb-0">{{ CLUBNAME }} - {{ TEAMNAME }}</h1>
          </Router-Link>
          <Select
            v-if="seasonStore.seasonsLoaded"
            :model-value="seasonStore.currentSeason"
            :options="seasonStore.seasons"
            size="small"
            class="text-xs!"
            disabled
            @update:model-value="seasonStore.setSeason"
          />
          <span v-else class="text-white text-xs">{{ seasonStore.currentSeason }}</span>
        </div>
      </div>

      <div class="items-center justify-end gap-6 flex">
        <Button v-if="storeAuth.user?.id" @click="storeAuth.logoutUser(toast, $t)">
          {{ $t('auth.logout') }}
        </Button>

        <Button v-else as="router-link" :to="{ name: 'auth' }">
          {{ $t('auth.login') }}
        </Button>
      </div>
    </div>
  </header>

  <nav class="bg-primary-900 text-white mb-12">
    <ul class="flex my-3 items-center justify-center text-sm font-semibold">
      <li>
        <Router-Link :to="{ name: 'home' }">{{ $t('match.game', 2) }}</Router-Link>
      </li>
      <li>
        <Router-Link :to="{ name: 'topscorers' }">{{ $t('common.toplist') }}</Router-Link>
      </li>
      <li>
        <Router-Link :to="{ name: 'players' }">{{ $t('player.player', 2) }}</Router-Link>
      </li>
    </ul>
  </nav>
</template>

<style scoped>
li:not(:last-child)::after {
  content: '|';
  margin-left: 1rem;
  margin-right: 1rem;
  color: rgba(255, 255, 255, 0.5);
}
</style>
