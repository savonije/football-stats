<script setup lang="ts">
import { ref } from 'vue'
import { useToast } from 'primevue'
import Button from 'primevue/button'
import Divider from 'primevue/divider'
import Drawer from 'primevue/drawer'
import { useI18n } from 'vue-i18n'

import { useStoreAuth } from '@/stores/authStore'

import AddMatchDialog from '@/components/AddMatchDialog.vue'
import AddPlayerDialog from '@/components/AddPlayerDialog.vue'

const storeAuth = useStoreAuth()
const toast = useToast()
const { t } = useI18n()

const drawerVisible = ref(false)
const showAddMatchDialog = ref(false)
const showAddPlayerDialog = ref(false)

const openAddMatch = () => {
  drawerVisible.value = false
  showAddMatchDialog.value = true
}

const openAddPlayer = () => {
  drawerVisible.value = false
  showAddPlayerDialog.value = true
}

const logout = () => {
  drawerVisible.value = false
  storeAuth.logoutUser(toast, t)
}

defineExpose({
  open: () => {
    drawerVisible.value = true
  },
})
</script>

<template>
  <Drawer v-model:visible="drawerVisible" position="right" :header="t('common.menu')">
    <div class="flex flex-col gap-1">
      <Router-Link :to="{ name: 'home' }" @click="drawerVisible = false">
        <Button :label="$t('match.game', 2)" icon="pi pi-home" text fluid class="justify-start!" />
      </Router-Link>
      <Router-Link :to="{ name: 'topscorers' }" @click="drawerVisible = false">
        <Button
          :label="$t('common.toplist')"
          icon="pi pi-chart-bar"
          text
          fluid
          class="justify-start!"
        />
      </Router-Link>
      <Router-Link :to="{ name: 'players' }" @click="drawerVisible = false">
        <Button
          :label="$t('player.player', 2)"
          icon="pi pi-users"
          text
          fluid
          class="justify-start!"
        />
      </Router-Link>

      <template v-if="storeAuth.user?.id">
        <Divider />
        <Button
          :label="$t('match.addMatch')"
          icon="pi pi-plus"
          text
          fluid
          class="justify-start!"
          @click="openAddMatch"
        />
        <Button
          :label="$t('player.addPlayer')"
          icon="pi pi-user-plus"
          text
          fluid
          class="justify-start!"
          @click="openAddPlayer"
        />
        <Divider />
        <Button
          :label="$t('auth.logout')"
          icon="pi pi-sign-out"
          text
          fluid
          class="justify-start!"
          severity="danger"
          @click="logout"
        />
      </template>

      <template v-else>
        <Divider />
        <Button
          as="router-link"
          :to="{ name: 'auth' }"
          :label="$t('auth.login')"
          icon="pi pi-sign-in"
          text
          fluid
          class="justify-start!"
          @click="drawerVisible = false"
        />
      </template>
    </div>
  </Drawer>

  <AddMatchDialog v-model:visible="showAddMatchDialog" />
  <AddPlayerDialog v-model:visible="showAddPlayerDialog" />
</template>
