<script setup lang="ts">
import { ref } from 'vue'
import MatchList from '@/components/MatchList.vue'
import AddMatchDialog from '@/components/AddMatchDialog.vue'
import { Button } from 'primevue'

const showAddMatchDialog = ref(false)
</script>

<template>
  <div class="p-6">
    <div class="mb-4">
      <Button
        label="Nieuwe wedstrijd toevoegen"
        icon="pi pi-plus"
        @click="showAddMatchDialog = true"
      />
    </div>

    <AddMatchDialog v-model:visible="showAddMatchDialog" />

    <MatchList />
  </div>
</template>
