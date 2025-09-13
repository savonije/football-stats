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

onMounted(() => {
  matchStore.fetchMatches(seasonId)
})

const onRowClick = (event: DataTableRowClickEvent) => {
  router.push({ name: 'matchDetail', params: { id: event.data.id } })
}
</script>

<template>
  <DataTable
    v-if="matchStore.matchesLoaded && matchStore.matches.length"
    :value="matchStore.matches"
    :loading="!matchStore.matchesLoaded"
    data-key="id"
    class="shadow-lg rounded-2xl"
    striped-rows
    sort-field="date"
    :sort-order="-1"
    @row-click="onRowClick"
  >
    <Column field="date" :header="$t('common.date')" sortable>
      <template #body="{ data }">
        {{ data.date ? dayjs(data.date.toDate()).format('DD-MM-YYYY') : '-' }}
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
        <span
          class="font-bold"
          :class="
            data.result
              ? data.result.goalsFor > data.result.goalsAgainst
                ? 'text-green-700'
                : data.result.goalsFor < data.result.goalsAgainst
                  ? 'text-red-700'
                  : 'text-yellow-700'
              : 'text-gray-500'
          "
        >
          {{ data.result ? `${data.result.goalsFor}-${data.result.goalsAgainst}` : '-' }}
        </span>
      </template>
    </Column>

    <Column class="!text-right hidden sm:table-cell">
      <template #body="{ data }">
        <Button
          as="router-link"
          size="small"
          :to="{ name: 'matchDetail', params: { id: data.id } }"
          icon="pi pi-chevron-right"
          :aria-label="$t('common.viewMatchDetails')"
        />
      </template>
    </Column>
  </DataTable>

  <div v-else-if="!matchStore.matchesLoaded" class="flex justify-content-center">
    <ProgressSpinner />
  </div>

  <h1 v-else>{{ $t('common.noMatches') }}</h1>
</template>
