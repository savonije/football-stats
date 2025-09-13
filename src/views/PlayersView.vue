<script setup lang="ts">
import PlayersList from '@/components/PlayerList.vue'
import DefaultLayout from '@/layouts/DefaultLayout.vue'
</script>

<template>
  <DefaultLayout>
    <h1 class="mb-3">{{ $t('common.player', 2) }}</h1>
    <PlayersList />
  </DefaultLayout>
</template>
