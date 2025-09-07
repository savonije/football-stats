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
    <div class="mb-6">
      <Button :label="$t('common.addMatch')" icon="pi pi-plus" @click="showAddMatchDialog = true" />
    </div>

    <AddMatchDialog v-model:visible="showAddMatchDialog" />

    <MatchList />
  </DefaultLayout>
</template>
