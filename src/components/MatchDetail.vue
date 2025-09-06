<script setup lang="ts">
import { computed, onMounted } from 'vue'
import { useMatchStore } from '@/stores/matchStore'
import type { Appearance } from '@/types'

import DataTable from 'primevue/datatable'
import Column from 'primevue/column'
import { useRoute } from 'vue-router'
import { usePlayerStore } from '@/stores/playerStore'

const playerStore = usePlayerStore()
const matchStore = useMatchStore()
const seasonId = '2025-2026'

const route = useRoute()
const matchId = computed(() => route.params.id as string)

const appearancesWithName = computed(() =>
  matchStore.presentPlayers.map((player) => ({
    ...player,
    playerName: playerStore.players[player.playerId] || player.playerId,
  })),
)

onMounted(async () => {
  await matchStore.fetchMatchDetails(seasonId, matchId.value)
  await Promise.all(
    matchStore.presentPlayers.map((player) => playerStore.fetchPlayerName(player.playerId)),
  )
})
</script>

<template>
  <div class="p-6">
    <h1 class="text-2xl font-bold mb-4">
      {{ $t('common.opponent') }}: {{ matchStore.selectedMatch?.opponent }}
    </h1>

    <p class="mb-4">
      {{ $t('common.score') }}:
      <span v-if="matchStore.selectedMatch?.result">
        {{ matchStore.selectedMatch.result.goalsFor }} -
        {{ matchStore.selectedMatch.result.goalsAgainst }}
      </span>
      <span v-else>-</span>
    </p>

    <h2 class="text-xl font-semibold mb-2">{{ $t('common.presentPlayers') }}</h2>
    <DataTable
      :value="appearancesWithName"
      :loading="matchStore.loadingAppearances"
      dataKey="id"
      stripedRows
    >
      <Column field="playerName" :header="$t('common.player')" />
      <Column :header="$t('common.goal', 2)">
        <template #body="{ data }">
          {{ (data as Appearance).goals || 0 }}
        </template>
      </Column>
      <Column :header="$t('common.position')">
        <template #body="{ data }">
          {{ data.isGoalkeeper ? 'Keeper' : 'Speler' }}
        </template>
      </Column>
    </DataTable>
  </div>
</template>
