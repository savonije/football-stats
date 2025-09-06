<script setup lang="ts">
import { onMounted } from 'vue'
import { useMatchStore } from '@/stores/matchStore'

import DataTable from 'primevue/datatable'
import Column from 'primevue/column'

const matchStore = useMatchStore()
const seasonId = '2025-2026'

onMounted(async () => {
  await matchStore.fetchMatches(seasonId)
})
</script>

<template>
  <div class="p-6">
    <h1>{{ $t('common.title') }}</h1>
    <DataTable
      v-if="matchStore.matches.length"
      :value="matchStore.matches"
      :loading="matchStore.loading"
      dataKey="id"
      class="shadow-lg rounded-2xl"
      stripedRows
    >
      <Column field="date" :header="$t('common.date')" />
      <Column field="opponent" :header="$t('common.opponent')" />
      <Column :header="$t('common.homeOrAway')">
        <template #body="{ data }">
          {{ data.home ? 'Thuis' : 'Uit' }}
        </template>
      </Column>

      <Column :header="$t('common.result')">
        <template #body="{ data }">
          {{ data.result ? `${data.result.goalsFor}-${data.result.goalsAgainst}` : '-' }}
        </template>
      </Column>
      <Column>
        <template #body="{ data }">
          <router-link :to="{ name: 'matchDetail', params: { id: data.id } }"> Bekijk </router-link>
        </template>
      </Column>
    </DataTable>
  </div>
</template>
