<script setup lang="ts">
import { onMounted } from 'vue'
import { useMatchStore } from '@/stores/matchStore'

import DataTable from 'primevue/datatable'
import Column from 'primevue/column'

const matchStore = useMatchStore()
const seasonId = '2025-2026'

onMounted(async () => {
  await matchStore.fetchMatches(seasonId)
  console.log('Matches loaded from store:', matchStore.matches)
})
</script>

<template>
  <div class="p-6">
    <DataTable
      v-if="matchStore.matches.length"
      :value="matchStore.matches"
      :loading="matchStore.loading"
      dataKey="id"
      class="shadow-lg rounded-2xl"
      stripedRows
    >
      <Column field="date" :header="$t('common.matches.date')" />
      <Column field="opponent" :header="$t('common.matches.opponent')" />
      <Column :header="$t('common.matches.homeOrAway')">
        <template #body="{ data }">
          {{ data.home ? 'Thuis' : 'Uit' }}
        </template>
      </Column>

      <Column :header="$t('common.matches.result')">
        <template #body="{ data }">
          {{ data.result ? `${data.result.goalsFor}-${data.result.goalsAgainst}` : '-' }}
        </template>
      </Column>
    </DataTable>
  </div>
</template>
