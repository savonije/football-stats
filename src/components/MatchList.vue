<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { useMatchStore } from '@/stores/matchStore'
import { useRouter } from 'vue-router'

import dayjs from 'dayjs'
import {
  Button,
  Column,
  InputText,
  InputGroup,
  InputGroupAddon,
  DataTable,
  type DataTableRowClickEvent,
} from 'primevue'

import ProgressSpinner from '@/components/ProgressSpinner.vue'

import { SEASON } from '@/constants'
import { useI18n } from 'vue-i18n'

const matchStore = useMatchStore()
const seasonId = SEASON
const router = useRouter()

const { t } = useI18n()

const filteredCount = ref(0)

const filters = ref({
  global: { value: null, matchMode: 'contains' },
})

const onFilter = (event: { filteredValue: string }) => {
  filteredCount.value = event.filteredValue?.length ?? matchStore.matches.length
}

onMounted(() => {
  matchStore.fetchMatches(seasonId)
})

const onRowClick = (event: DataTableRowClickEvent) => {
  router.push({ name: 'matchDetail', params: { id: event.data.id } })
}
</script>

<template>
  <div class="mb-4 flex justify-end">
    <InputGroup>
      <InputGroupAddon>
        <i class="pi pi-search"></i>
      </InputGroupAddon>
      <InputText
        v-model="filters.global.value"
        icon="pi-search"
        :placeholder="t('common.searchOpponent')"
        class="w-full sm:w-64"
      />
    </InputGroup>
  </div>

  <div class="flex justify-end mb-3">
    <span v-if="matchStore.matchesLoaded" class="font-bold text-gray-500">
      {{ filteredCount }} / {{ matchStore.matches.length }}
      {{ t('match.game', 2) }}
    </span>
  </div>

  <DataTable
    v-if="matchStore.matchesLoaded && matchStore.matches.length"
    v-model:filters="filters"
    :value="matchStore.matches"
    :loading="!matchStore.matchesLoaded"
    :global-filter-fields="['opponent']"
    data-key="id"
    class="shadow-lg rounded-2xl"
    paginator
    :rows="10"
    striped-rows
    sort-field="date"
    :sort-order="-1"
    @row-click="onRowClick"
    @filter="onFilter"
  >
    <Column field="date" :header="t('common.date')" sortable>
      <template #body="{ data }">
        {{ data.date ? dayjs(data.date.toDate()).format('DD-MM-YYYY') : '-' }}
      </template>
    </Column>

    <Column field="opponent" :header="t('common.opponent')" sortable>
      <template #body="{ data }">
        {{ data.opponent }}
      </template>
    </Column>

    <Column :header="t('common.homeOrAway')" class="hidden sm:table-cell">
      <template #body="{ data }">
        {{ data.home ? t('common.home') : t('common.away') }}
      </template>
    </Column>

    <Column :header="t('common.result')">
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

    <Column class="text-right! hidden sm:table-cell">
      <template #body="{ data }">
        <Button
          as="router-link"
          size="small"
          :to="{ name: 'matchDetail', params: { id: data.id } }"
          icon="pi pi-chevron-right"
          :aria-label="t('match.viewMatchDetails')"
        />
      </template>
    </Column>
  </DataTable>

  <div v-else-if="!matchStore.matchesLoaded" class="flex justify-content-center">
    <ProgressSpinner />
  </div>

  <h1 v-else>{{ t('match.noMatches') }}</h1>
</template>
