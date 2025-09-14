<script setup lang="ts">
import { computed, onMounted } from 'vue'
import { usePlayerStore } from '@/stores/playerStore'
import { useMatchStore } from '@/stores/matchStore'
import { SEASON } from '@/constants'
import { DataTable, Column } from 'primevue'

const playerStore = usePlayerStore()
const matchStore = useMatchStore()

const playersWithGoals = computed(() => {
  if (!playerStore.playersLoaded || !matchStore.appearancesLoaded) return []

  return playerStore.players.map((player) => {
    const appearances = matchStore.appearances.filter((a) => a.playerId === player.id)
    const totalGoals = appearances.reduce((sum, a) => sum + (a.goals || 0), 0)
    return { ...player, totalGoals }
  })
})

onMounted(() => {
  playerStore.fetchPlayers()
  matchStore.fetchAppearances(SEASON)
})
</script>

<template>
  <DataTable
    :value="playersWithGoals"
    :sortField="'totalGoals'"
    :loading="!playerStore.playersLoaded || !matchStore.appearancesLoaded"
    :sortOrder="-1"
    class="shadow-lg rounded-2xl"
    striped-rows
  >
    <Column field="name" :header="$t('common.name')" sortable></Column>
    <Column field="totalGoals" :header="$t('common.goal', 2)" sortable></Column>
  </DataTable>
</template>
