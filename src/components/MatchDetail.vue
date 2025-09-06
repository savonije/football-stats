<script setup lang="ts">
import { computed, onMounted } from 'vue'
import { useMatchStore } from '@/stores/matchStore'
import type { Appearance } from '@/types'

import DataTable from 'primevue/datatable'
import Column from 'primevue/column'
import { useRoute } from 'vue-router'
import { usePlayerStore } from '@/stores/playerStore'
import { SEASON } from '@/constants'

import dayjs from 'dayjs'

const playerStore = usePlayerStore()
const matchStore = useMatchStore()
const seasonId = SEASON

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
  await Promise.all(matchStore.presentPlayers.map((p) => playerStore.fetchPlayerName(p.playerId)))
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

    <p class="mb-4" v-if="matchStore.selectedMatch?.date">
      {{ $t('common.date') }}:
      <span>
        {{ dayjs(matchStore.selectedMatch.date.toDate()).format('DD-MM-YY') }}
      </span>
    </p>

    <h2 class="text-xl font-semibold mb-2">{{ $t('common.presentPlayers') }}</h2>
    <DataTable
      :value="appearancesWithName"
      :loading="matchStore.loadingAppearances"
      dataKey="id"
      stripedRows
    >
      <Column :header="$t('common.player')">
        <template #body="{ data }">
          <router-link :to="{ name: 'playerDetail', params: { id: data.playerId } }">
            {{ data.playerName }}
          </router-link>
        </template>
      </Column>
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
