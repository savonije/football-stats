<script setup lang="ts">
import { Toast } from 'primevue'
import { RouterView } from 'vue-router'

import { useStoreAuth } from '@/stores/authStore'
import { onMounted } from 'vue'

const storeAuth = useStoreAuth()

onMounted(() => {
  storeAuth.init()
})
</script>

<template>
  <RouterView />

  <Toast />
</template>
