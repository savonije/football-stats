<script setup lang="ts">
import { useToast } from 'primevue'
import Button from 'primevue/button'

import { useStoreAuth } from '@/stores/authStore'

const storeAuth = useStoreAuth()
const toast = useToast()
</script>

<template>
  <header class="bg-primary text-white mb-6 py-3 sm:p-3 sm:py-6">
    <div class="container flex items-center justify-between gap-6">
      <Router-Link :to="{ name: 'home' }" variant="text" class="!text-white">
        <h1>SV Apollo '69 - JO 9</h1>
      </Router-Link>

      <div class="hidden items-center justify-end gap-6 lg:flex xl:gap-9">
        <Button v-if="storeAuth.user?.id" @click="storeAuth.logoutUser(toast, $t)">
          {{ $t('common.logout') }}
        </Button>

        <Button v-else as="router-link" :to="{ name: 'auth' }" variant="outlined">
          {{ $t('common.login') }}
        </Button>
      </div>
    </div>
  </header>
</template>
