<script setup lang="ts">
import { ref } from 'vue'
import PlayersList from '@/components/PlayerList.vue'
import DefaultLayout from '@/layouts/DefaultLayout.vue'
import AddPlayerDialog from '@/components/AddPlayerDialog.vue'
import { useStoreAuth } from '@/stores/authStore'
import { Button } from 'primevue'

const AuthStore = useStoreAuth()
const addPlayerVisible = ref(false)
</script>

<template>
  <DefaultLayout>
    <div class="flex justify-between items-center mb-3">
      <h1>{{ $t('player.player', 2) }}</h1>
      <Button
        v-if="AuthStore.user?.id"
        :label="$t('player.addPlayer')"
        icon="pi pi-plus"
        @click="addPlayerVisible = true"
      />
    </div>
    <PlayersList />
    <AddPlayerDialog v-model:visible="addPlayerVisible" />
  </DefaultLayout>
</template>
