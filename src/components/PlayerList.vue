<script setup lang="ts">
import { computed, onMounted } from 'vue'
import { usePlayerStore } from '@/stores/playerStore'

import DataTable from 'primevue/datatable'
import Column from 'primevue/column'
import { Button, ProgressSpinner } from 'primevue'

const playerStore = usePlayerStore()

const playersArray = computed(() =>
  Object.entries(playerStore.players).map(([id, name]) => ({
    id,
    name,
  })),
)

onMounted(async () => {
  await playerStore.fetchPlayers()
})
</script>

<template>
  <h1 class="mb-2">{{ $t('common.player', 2) }}</h1>

  <DataTable
    v-if="playersArray.length"
    :value="playersArray"
    :loading="playerStore.loading"
    dataKey="id"
    class="shadow-lg rounded-2xl"
    stripedRows
    :sort-field="'name'"
    :sort-order="1"
  >
    <Column field="name" :header="$t('common.name')" sortable />

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

  <div v-else-if="playerStore.loading" class="flex justify-content-center">
    <ProgressSpinner />
  </div>

  <h1 v-else>{{ $t('common.noPlayers') }}</h1>
</template>
