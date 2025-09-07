<script setup lang="ts">
import { computed, onMounted } from 'vue'
import { useMatchStore } from '@/stores/matchStore'
import type { Appearance } from '@/types'

import DataTable from 'primevue/datatable'
import Column from 'primevue/column'
import { useRoute } from 'vue-router'
import { usePlayerStore } from '@/stores/playerStore'
import { SEASON } from '@/constants'

import { Button } from 'primevue'

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
  <div class="w-[800px] max-w-full mx-auto p-4">
    <h1
      class="mb-0 flex gap-2 items-center text-primary"
      :class="matchStore.selectedMatch?.home ? 'flex-row' : 'flex-row-reverse'"
    >
      <span>SV Apollo '69</span>
      <span> - </span>
      <span>{{ matchStore.selectedMatch?.opponent }}</span>
    </h1>
    <div v-if="matchStore.selectedMatch?.date" class="text-gray-600 text-sm">
      {{ dayjs(matchStore.selectedMatch.date.toDate()).format('D MMMM YYYY') }}
    </div>

    <div
      class="flex items-center justify-center gap-3 my-12"
      v-if="matchStore.selectedMatch?.result"
    >
      <div
        class="bg-white flex items-center justify-center text-6xl font-bold size-32 rounded shadow"
      >
        {{ matchStore.selectedMatch.result.goalsFor }}
      </div>
      <div>-</div>
      <div
        class="bg-white flex items-center justify-center text-6xl font-bold size-32 rounded shadow"
      >
        {{ matchStore.selectedMatch.result.goalsAgainst }}
      </div>
    </div>

    <h2 class="text-xl font-semibold mb-2">{{ $t('common.presentPlayers') }}</h2>
    <DataTable
      :value="appearancesWithName"
      :loading="matchStore.loadingAppearances"
      dataKey="id"
      stripedRows
      class="shadow"
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
      <Column :header="$t('common.wasKeeper')">
        <template #body="{ data }">
          {{ data.isGoalkeeper ? $t('common.yes') : $t('common.no') }}
        </template>
      </Column>
      <Column class="hidden sm:table-cell">
        <template #body="{ data }">
          <Button
            as="router-link"
            :to="{ name: 'playerDetail', params: { id: data.playerId } }"
            size="small"
          >
            {{ $t('common.viewPlayer') }}
          </Button>
        </template>
      </Column>
    </DataTable>
  </div>
</template>
