<script setup lang="ts">
import DefaultLayout from '@/layouts/DefaultLayout.vue'
import TopscorersList from '@/components/TopscorersList.vue'
</script>

<template>
  <DefaultLayout>
    <h1 class="mb-3">{{ $t('common.topscorers') }}</h1>
    <TopscorersList />
  </DefaultLayout>
</template>
