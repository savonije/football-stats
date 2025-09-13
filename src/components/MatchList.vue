<script setup lang="ts">
import { onMounted } from 'vue'
import { useMatchStore } from '@/stores/matchStore'
import { useRouter } from 'vue-router'

import DataTable, { type DataTableRowClickEvent } from 'primevue/datatable'
import Column from 'primevue/column'
import dayjs from 'dayjs'

import { SEASON } from '@/constants'

import { Button, ProgressSpinner } from 'primevue'

const matchStore = useMatchStore()
const seasonId = SEASON
const router = useRouter()

onMounted(async () => {
  await matchStore.fetchMatches(seasonId)
})

const onRowClick = (event: DataTableRowClickEvent) => {
  router.push({ name: 'matchDetail', params: { id: event.data.id } })
}
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
    sort-field="date"
    :sort-order="-1"
    @rowClick="onRowClick"
  >
    <Column field="date" :header="$t('common.date')" sortable>
      <template #body="{ data }">
        {{ dayjs(data.date.toDate()).format('DD-MM-YYYY') }}
      </template>
    </Column>

    <Column field="opponent" :header="$t('common.opponent')">
      <template #body="{ data }">
        {{ data.opponent }}
      </template>
    </Column>

    <Column :header="$t('common.homeOrAway')" class="hidden sm:table-cell">
      <template #body="{ data }">
        {{ data.home ? $t('common.home') : $t('common.away') }}
      </template>
    </Column>

    <Column :header="$t('common.result')">
      <template #body="{ data }">
        {{ data.result ? `${data.result.goalsFor}-${data.result.goalsAgainst}` : '-' }}
      </template>
    </Column>

    <Column class="!text-right hidden sm:table-cell">
      <template #body>
        <Button size="small">
          {{ $t('common.view') }}
        </Button>
      </template>
    </Column>
  </DataTable>

  <div v-else-if="matchStore.loading" class="flex justify-content-center">
    <ProgressSpinner />
  </div>

  <h1 v-else>{{ $t('common.noMatches') }}</h1>
</template>
