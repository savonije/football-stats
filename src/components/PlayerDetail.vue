<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { useRoute } from 'vue-router'
import { useMatchStore } from '@/stores/matchStore'
import { usePlayerStore } from '@/stores/playerStore'
import { SEASON } from '@/constants'

import { Skeleton, Card } from 'primevue'
import type { Player } from '@/types'

const matchStore = useMatchStore()
const playerStore = usePlayerStore()
const route = useRoute()

const seasonId = SEASON
const playerId = computed(() => route.params.id as string)
const player = ref<Player | null>(null)

onMounted(async () => {
  player.value = await playerStore.fetchPlayer(playerId.value)
  await matchStore.fetchMatches(seasonId)
  await matchStore.fetchPlayerAppearances(seasonId)
})

const playerAppearances = computed(() =>
  matchStore.appearances.filter((a) => a.playerId === playerId.value),
)

const totalGoals = computed(() =>
  playerAppearances.value.reduce((sum, p) => sum + (p.goals || 0), 0),
)

const totalAppearances = computed(() => playerAppearances.value.filter((p) => p.present).length)

const totalKeeper = computed(() => playerAppearances.value.filter((p) => p.isGoalkeeper).length)

const totalMatches = computed(() => matchStore.matches.length)

const goalsPerMatch = computed(() =>
  totalAppearances.value > 0 ? (totalGoals.value / totalAppearances.value).toFixed(2) : '0.00',
)

const attendancePercentage = computed(() =>
  totalMatches.value > 0 ? Math.round((totalAppearances.value / totalMatches.value) * 100) : 0,
)
</script>

<template>
  <h1 class="text-2xl font-bold mb-4" v-if="player">{{ player.name }}</h1>
  <span v-else><Skeleton height="20px" width="100px" class="mb-4" /></span>

  <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
    <Card>
      <template #title>
        <h2>{{ $t('common.totalGoals') }}</h2>
      </template>
      <template #content>
        <p class="text-3xl font-bold">{{ totalGoals }}</p>
      </template>
    </Card>

    <Card>
      <template #title>
        <h2>{{ $t('common.totalAppearances') }}</h2>
      </template>
      <template #content>
        <p class="text-3xl font-bold">{{ totalAppearances }}/{{ totalMatches }}</p>
      </template>
    </Card>

    <Card>
      <template #title>
        <h2>{{ $t('common.totalKeeper') }}</h2>
      </template>
      <template #content>
        <p class="text-3xl font-bold">{{ totalKeeper }}</p>
      </template>
    </Card>

    <Card>
      <template #title><h2>Goals / wedstrijd</h2></template>
      <template #content>
        <p class="text-3xl font-bold">{{ goalsPerMatch }}</p>
      </template>
    </Card>

    <Card>
      <template #title><h2>Aanwezigheid (%)</h2></template>
      <template #content>
        <p class="text-3xl font-bold">{{ attendancePercentage }}%</p>
      </template>
    </Card>

    <Card class="md:col-span-3">
      <template #title><h2>Spelerinformatie</h2></template>
      <template #content>
        <dl class="grid grid-cols-2 gap-x-4 gap-y-2">
          <dt class="font-medium">Kledingmaat</dt>
          <dd>{{ player?.clothingSize ?? '-' }}</dd>

          <dt class="font-medium">Jas</dt>
          <dd>{{ player?.hasJacket ? '✅ Ja' : '❌ Nee' }}</dd>

          <dt class="font-medium">Tas</dt>
          <dd>{{ player?.hasBag ? '✅ Ja' : '❌ Nee' }}</dd>
        </dl>
      </template>
    </Card>
  </div>
</template>
