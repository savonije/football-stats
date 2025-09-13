<script setup lang="ts">
import { useToast } from 'primevue'
import Button from 'primevue/button'

import { useStoreAuth } from '@/stores/authStore'

import { SEASON } from '@/constants'

const storeAuth = useStoreAuth()
const toast = useToast()
</script>

<template>
  <header class="bg-primary text-white py-3 sm:p-3 sm:py-6">
    <div class="container flex items-center justify-between gap-6">
      <Router-Link :to="{ name: 'home' }" variant="text">
        <h1 class="text-white mb-0">SV Apollo '69 - JO9</h1>
        <span class="text-white text-xs">{{ SEASON }}</span>
      </Router-Link>

      <div class="items-center justify-end gap-6 flex">
        <Button v-if="storeAuth.user?.id" @click="storeAuth.logoutUser(toast, $t)">
          {{ $t('common.logout') }}
        </Button>

        <Button v-else as="router-link" :to="{ name: 'auth' }" variant="outlined">
          {{ $t('common.login') }}
        </Button>
      </div>
    </div>
  </header>

  <nav class="bg-primary-900 text-white mb-6">
    <ul class="flex gap-6 my-3 items-center justify-center">
      <li>
        <Router-Link :to="{ name: 'home' }">{{ $t('common.game', 2) }}</Router-Link>
      </li>
      <li>
        <Router-Link :to="{ name: 'topscorers' }">{{ $t('common.topscorers') }}</Router-Link>
      </li>
      <li>
        <Router-Link :to="{ name: 'players' }">{{ $t('common.player', 2) }}</Router-Link>
      </li>
    </ul>
  </nav>
</template>
