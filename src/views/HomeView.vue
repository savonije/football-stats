<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue'
import MatchList from '@/components/MatchList.vue'
import MatchResultsChart from '@/components/MatchResultsChart.vue'
import AddMatchDialog from '@/components/AddMatchDialog.vue'
import { Button, Card } from 'primevue'

import DefaultLayout from '@/layouts/DefaultLayout.vue'
import { useStoreAuth } from '@/stores/authStore'
import { useMatchStore } from '@/stores/matchStore'

const showAddMatchDialog = ref(false)
const storeAuth = useStoreAuth()
const matchStore = useMatchStore()

const isMobile = ref(window.innerWidth < 640)
const onResize = () => {
  isMobile.value = window.innerWidth < 640
}
onMounted(() => window.addEventListener('resize', onResize))
onUnmounted(() => window.removeEventListener('resize', onResize))

const recentMatchData = computed(() => {
  const count = isMobile.value ? 5 : 10
  return [...matchStore.matches]
    .filter((match) => match.ended && match.result)
    .sort((a, b) => {
      const aTime = a.date?.toMillis?.() ?? 0
      const bTime = b.date?.toMillis?.() ?? 0
      return aTime - bTime
    })
    .slice(-count)
    .map((match) => ({
      opponent: match.opponent,
      goalsFor: match.result!.goalsFor,
      goalsAgainst: match.result!.goalsAgainst,
    }))
})
</script>

<template>
  <DefaultLayout>
    <div class="mb-6 text-right" v-if="storeAuth.user?.id">
      <Button :label="$t('match.addMatch')" icon="pi pi-plus" @click="showAddMatchDialog = true" />
    </div>

    <AddMatchDialog v-model:visible="showAddMatchDialog" />

    <Card>
      <template #title>
        <h2 class="mb-2">{{ $t('match.recentResults') }}</h2>
      </template>
      <template #content>
        <MatchResultsChart v-if="matchStore.matchesLoaded" :data="recentMatchData" />
      </template>
    </Card>

    <h1 class="mb-3 mt-8">{{ $t('match.game', 2) }}</h1>
    <MatchList />
  </DefaultLayout>
</template>
