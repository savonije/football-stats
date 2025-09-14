<script setup lang="ts">
import { Toast, ConfirmDialog } from 'primevue'
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
  <ConfirmDialog />
  <Toast />
</template>
