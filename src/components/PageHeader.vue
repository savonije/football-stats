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
  <header class="bg-primary text-white py-3 sm:p-3 sm:py-6 mb-12">
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

      <Button
        icon="pi pi-bars"
        class="text-white! hover:text-primary!"
        text
        rounded
        :aria-label="t('common.menu')"
        @click="navDrawer?.open()"
      />
    </div>
  </header>

  <NavDrawer ref="navDrawer" />
</template>
