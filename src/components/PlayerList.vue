<script setup lang="ts">
import { onMounted } from 'vue'
import { usePlayerStore } from '@/stores/playerStore'

import DataTable from 'primevue/datatable'
import Column from 'primevue/column'
import { Button, ProgressSpinner } from 'primevue'

const playerStore = usePlayerStore()

onMounted(() => {
  playerStore.fetchPlayers()
})
</script>

<template>
  <h1 class="mb-2">{{ $t('common.player', 2) }}</h1>

  <DataTable
    v-if="playerStore.playersLoaded && playerStore.players.length"
    :value="playerStore.players"
    dataKey="id"
    class="shadow-lg rounded-2xl"
    stripedRows
    :sort-field="'name'"
    :sort-order="1"
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
        >
          {{ $t('common.view') }}
        </Button>
      </template>
    </Column>
  </DataTable>

  <div v-else-if="!playerStore.playersLoaded" class="flex justify-content-center">
    <ProgressSpinner />
  </div>

  <h1 v-else>{{ $t('common.noPlayers') }}</h1>
</template>
