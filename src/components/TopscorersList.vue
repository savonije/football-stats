<script setup lang="ts">
import { computed, onMounted } from 'vue'
import { usePlayerStore } from '@/stores/playerStore'
import { useMatchStore } from '@/stores/matchStore'
import { SEASON } from '@/constants'
import { DataTable, Column, type DataTableRowClickEvent } from 'primevue'

import router from '@/router'

const playerStore = usePlayerStore()
const matchStore = useMatchStore()

const playerTotalStats = computed(() => {
  if (!playerStore.playersLoaded || !matchStore.appearancesLoaded) return []

  return playerStore.players.map((player) => {
    const appearances = matchStore.appearances.filter((a) => a.playerId === player.id)

    const totalGoals = appearances.reduce((sum, a) => sum + (a.goals || 0), 0)

    const goalkeeperCount = appearances.filter((a) => a.isGoalkeeper).length

    return {
      ...player,
      totalGoals,
      goalkeeperCount,
    }
  })
})

const onRowClick = (event: DataTableRowClickEvent) => {
  router.push({ name: 'playerDetail', params: { id: event.data.id } })
}

onMounted(() => {
  playerStore.fetchPlayers()
  matchStore.fetchAppearances(SEASON)
})
</script>

<template>
  <DataTable
    :value="playerTotalStats"
    :sortField="'totalGoals'"
    :loading="!playerStore.playersLoaded || !matchStore.appearancesLoaded"
    :sortOrder="-1"
    class="shadow-lg rounded-2xl"
    striped-rows
    @row-click="onRowClick"
  >
    <Column field="name" :header="$t('common.name')" sortable />
    <Column field="totalGoals" :header="$t('common.goal', 2)" sortable />
    <Column field="goalkeeperCount" :header="$t('player.totalKeeper')" sortable />
  </DataTable>
</template>
