<script setup lang="ts">
import { ref } from 'vue'
import MatchList from '@/components/MatchList.vue'
import AddMatchDialog from '@/components/AddMatchDialog.vue'
import { Button } from 'primevue'

import DefaultLayout from '@/layouts/DefaultLayout.vue'

const showAddMatchDialog = ref(false)
</script>

<template>
  <DefaultLayout>
    <div class="p-6">
      <div class="mb-4">
        <Button
          :label="$t('common.addMatch')"
          icon="pi pi-plus"
          @click="showAddMatchDialog = true"
        />
      </div>

      <AddMatchDialog v-model:visible="showAddMatchDialog" />

      <MatchList />
    </div>
  </DefaultLayout>
</template>
