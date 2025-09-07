<script setup lang="ts">
import { onMounted } from 'vue'
import { useMatchStore } from '@/stores/matchStore'

import DataTable from 'primevue/datatable'
import Column from 'primevue/column'
import dayjs from 'dayjs'

import { SEASON } from '@/constants'

const matchStore = useMatchStore()
const seasonId = SEASON

onMounted(async () => {
  await matchStore.fetchMatches(seasonId)
})
</script>

<template>
  <h1 class="mb-2">{{ $t('common.title') }}</h1>
  <DataTable
    v-if="matchStore.matches.length"
    :value="matchStore.matches"
    :loading="matchStore.loading"
    dataKey="id"
    class="shadow-lg rounded-2xl"
    stripedRows
  >
    <Column field="date" :header="$t('common.date')">
      <template #body="{ data }">
        {{ dayjs(data.date.toDate()).format('DD-MM-YY') }}
      </template>
    </Column>
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

  <h1 v-else>{{ $t('common.noMatches') }}</h1>
</template>
