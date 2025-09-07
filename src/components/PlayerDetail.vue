<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { useRoute } from 'vue-router'
import { useMatchStore } from '@/stores/matchStore'
import { usePlayerStore } from '@/stores/playerStore'
import { SEASON } from '@/constants'

import { Skeleton, Card } from 'primevue'

const matchStore = useMatchStore()
const playerStore = usePlayerStore()
const route = useRoute()

const seasonId = SEASON
const playerId = computed(() => route.params.id as string)
const playerName = ref('')

onMounted(async () => {
  playerName.value = await playerStore.fetchPlayerName(playerId.value)
  await matchStore.fetchPlayerAppearances(seasonId)
})

const playerAppearances = computed(() =>
  matchStore.appearances.filter((a) => a.playerId === playerId.value),
)

const totalGoals = computed(() =>
  playerAppearances.value.reduce((sum, player) => sum + (player.goals || 0), 0),
)

const totalAppearances = computed(
  () => playerAppearances.value.filter((player) => player.present).length,
)

const totalKeeper = computed(
  () => playerAppearances.value.filter((player) => player.isGoalkeeper).length,
)
</script>

<template>
  <h1 class="text-2xl font-bold mb-4" v-if="playerName">{{ playerName }}</h1>
  <span v-else><Skeleton height="20px" width="100px" class="mb-4" /></span>

  <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
    <Card class="shadow-lg rounded-2xl p-4 bg-white">
      <template #header>
        <h2 class="text-xl font-semibold mb-2">{{ $t('common.totalGoals') }}</h2>
      </template>
      <template #content>
        <p class="text-3xl font-bold">{{ totalGoals }}</p>
      </template>
    </Card>

    <Card class="shadow-lg rounded-2xl p-4 bg-white">
      <template #header>
        <h2 class="text-xl font-semibold mb-2">{{ $t('common.totalAppearances') }}</h2>
      </template>
      <template #content>
        <p class="text-3xl font-bold">{{ totalAppearances }}</p>
      </template>
    </Card>

    <Card class="shadow-lg rounded-2xl p-4 bg-white">
      <template #header>
        <h2 class="text-xl font-semibold mb-2">{{ $t('common.totalKeeper') }}</h2>
      </template>
      <template #content>
        <p class="text-3xl font-bold">{{ totalKeeper }}</p>
      </template>
    </Card>
  </div>
</template>
