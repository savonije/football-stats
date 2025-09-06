<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { useRoute } from 'vue-router'
import { useMatchStore } from '@/stores/matchStore'

const matchStore = useMatchStore()
const route = useRoute()

const seasonId = '2025-2026'
const playerId = computed(() => route.params.id as string)

const playerName = ref('')

import { usePlayerStore } from '@/stores/playerStore'

const playerStore = usePlayerStore()

onMounted(async () => {
  await matchStore.fetchPlayerAppearances(seasonId, playerId.value)
  playerName.value = await playerStore.fetchPlayerName(playerId.value)
})

const totalGoals = computed(() => matchStore.totalGoalsPerPlayer(playerId.value))
const totalAppearances = computed(
  () => matchStore.appearances.filter((a) => a.playerId === playerId.value && a.present).length,
)
const totalKeeper = computed(
  () =>
    matchStore.appearances.filter((a) => a.playerId === playerId.value && a.isGoalkeeper).length,
)
</script>

<template>
  <div class="p-6">
    <h1 class="text-2xl font-bold mb-4">{{ playerName }}</h1>

    <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
      <div class="shadow-lg rounded-2xl p-4 bg-white">
        <h2 class="text-xl font-semibold mb-2">{{ $t('common.totalGoals') }}</h2>
        <p class="text-3xl font-bold text-blue-600">{{ totalGoals }}</p>
      </div>

      <div class="shadow-lg rounded-2xl p-4 bg-white">
        <h2 class="text-xl font-semibold mb-2">{{ $t('common.totalAppearances') }}</h2>
        <p class="text-3xl font-bold text-green-600">{{ totalAppearances }}</p>
      </div>

      <div class="shadow-lg rounded-2xl p-4 bg-white">
        <h2 class="text-xl font-semibold mb-2">{{ $t('common.totalKeeper') }}</h2>
        <p class="text-3xl font-bold text-purple-600">{{ totalKeeper }}</p>
      </div>
    </div>
  </div>
</template>
