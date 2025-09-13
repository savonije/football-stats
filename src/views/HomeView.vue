<script setup lang="ts">
import { ref } from 'vue'
import MatchList from '@/components/MatchList.vue'
import AddMatchDialog from '@/components/AddMatchDialog.vue'
import { Button } from 'primevue'

import DefaultLayout from '@/layouts/DefaultLayout.vue'
import { useStoreAuth } from '@/stores/authStore'

const showAddMatchDialog = ref(false)
const storeAuth = useStoreAuth()
</script>

<template>
  <DefaultLayout>
    <div class="mb-6 text-right" v-if="storeAuth.user?.id">
      <Button :label="$t('common.addMatch')" icon="pi pi-plus" @click="showAddMatchDialog = true" />
    </div>

    <AddMatchDialog v-model:visible="showAddMatchDialog" />

    <h1 class="mb-3">{{ $t('common.title') }}</h1>
    <MatchList />
  </DefaultLayout>
</template>
