<script setup lang="ts">
import { onMounted } from 'vue'
import { usePlayerStore } from '@/stores/playerStore'

import { Button, Column, DataTable, type DataTableRowClickEvent } from 'primevue'

import ProgressSpinner from '@/components/ProgressSpinner.vue'

import router from '@/router'

const playerStore = usePlayerStore()

onMounted(() => {
  playerStore.fetchPlayers()
})

const onRowClick = (event: DataTableRowClickEvent) => {
  router.push({ name: 'playerDetail', params: { id: event.data.id } })
}
</script>

<template>
  <DataTable
    v-if="playerStore.playersLoaded && playerStore.players.length"
    :value="playerStore.players"
    data-key="id"
    class="shadow-lg rounded-2xl"
    striped-rows
    :sort-field="'name'"
    :sort-order="1"
    @row-click="onRowClick"
  >
    <Column field="name" :header="$t('common.name')" sortable>
      <template #body="{ data }">{{ data.name }}</template>
    </Column>

    <Column class="!text-right">
      <template #body="{ data }">
        <Button
          as="router-link"
          size="small"
          :to="{ name: 'playerDetail', params: { id: data.id } }"
          icon="pi pi-chevron-right"
          :aria-label="$t('player.viewPlayerDetails')"
        />
      </template>
    </Column>
  </DataTable>

  <div v-else-if="!playerStore.playersLoaded" class="flex justify-content-center">
    <ProgressSpinner />
  </div>

  <h1 v-else>{{ $t('player.noPlayers') }}</h1>
</template>
