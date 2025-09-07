<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { useRoute } from 'vue-router'
import { useMatchStore } from '@/stores/matchStore'
import { usePlayerStore } from '@/stores/playerStore'
import { useStoreAuth } from '@/stores/authStore'
import { SEASON } from '@/constants'
import { useToast } from 'primevue/usetoast'

import { Skeleton, Card, Dialog, InputText, Checkbox, Select, Button } from 'primevue'
import type { Player } from '@/types'
import { useI18n } from 'vue-i18n'

const matchStore = useMatchStore()
const playerStore = usePlayerStore()
const AuthStore = useStoreAuth()
const route = useRoute()
const toast = useToast()
const { t } = useI18n()

const seasonId = SEASON
const playerId = computed(() => route.params.id as string)
const player = ref<Player | null>(null)

const editVisible = ref(false)
const editForm = ref<Partial<Player>>({})

onMounted(async () => {
  player.value = await playerStore.fetchPlayer(playerId.value)
  await matchStore.fetchMatches(seasonId)
  await matchStore.fetchPlayerAppearances(seasonId)
})

const playerAppearances = computed(() =>
  matchStore.appearances.filter((a) => a.playerId === playerId.value),
)

const totalGoals = computed(() =>
  playerAppearances.value.reduce((sum, p) => sum + (p.goals || 0), 0),
)

const totalAppearances = computed(() => playerAppearances.value.filter((p) => p.present).length)
const totalKeeper = computed(() => playerAppearances.value.filter((p) => p.isGoalkeeper).length)
const totalMatches = computed(() => matchStore.matches.length)

const goalsPerMatch = computed(() =>
  totalAppearances.value > 0 ? (totalGoals.value / totalAppearances.value).toFixed(2) : '0.00',
)

const attendancePercentage = computed(() =>
  totalMatches.value > 0 ? Math.round((totalAppearances.value / totalMatches.value) * 100) : 0,
)

function openEditDialog() {
  if (player.value) {
    editForm.value = { ...player.value }
    editVisible.value = true
  }
}

async function savePlayer() {
  if (!player.value) return
  await playerStore.updatePlayer(player.value.id, editForm.value)
  player.value = { ...player.value, ...editForm.value } as Player
  editVisible.value = false

  toast.add({
    severity: 'success',
    summary: t('common.messages.success'),
    detail: t('common.messages.playerEditted'),
    life: 3000,
  })
}
</script>

<template>
  <h1 class="text-2xl font-bold mb-4 flex justify-between items-center">
    <span v-if="player">{{ player.name }}</span>
    <span v-else><Skeleton height="20px" width="100px" /></span>

    <Button
      v-if="player && AuthStore.user?.id"
      :label="$t('common.edit')"
      icon="pi pi-pencil"
      @click="openEditDialog"
    />
  </h1>

  <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
    <Card>
      <template #title>
        <h2>{{ $t('common.totalGoals') }}</h2>
      </template>
      <template #content>
        <p class="text-3xl font-bold">{{ totalGoals }}</p>
      </template>
    </Card>

    <Card>
      <template #title>
        <h2>{{ $t('common.totalAppearances') }}</h2>
      </template>
      <template #content>
        <p class="text-3xl font-bold">{{ totalAppearances }}/{{ totalMatches }}</p>
      </template>
    </Card>

    <Card>
      <template #title>
        <h2>{{ $t('common.totalKeeper') }}</h2>
      </template>
      <template #content>
        <p class="text-3xl font-bold">{{ totalKeeper }}</p>
      </template>
    </Card>

    <Card>
      <template #title>
        <h2>{{ $t('common.goalsPerMatch') }}</h2>
      </template>
      <template #content>
        <p class="text-3xl font-bold">{{ goalsPerMatch }}</p>
      </template>
    </Card>

    <Card>
      <template #title>
        <h2>{{ $t('common.attendancePercentage') }}</h2>
      </template>
      <template #content>
        <p class="text-3xl font-bold">{{ attendancePercentage }}%</p>
      </template>
    </Card>

    <Card class="md:col-span-3">
      <template #title>
        <h2>{{ $t('common.playerInfo') }}</h2>
      </template>
      <template #content>
        <dl class="grid grid-cols-2 gap-x-4 gap-y-2">
          <dt class="font-medium">{{ $t('common.clothingSize') }}</dt>
          <dd>{{ player?.clothingSize ?? '-' }}</dd>

          <dt class="font-medium">{{ $t('common.hasJacket') }}</dt>
          <dd>{{ player?.hasJacket ? $t('common.yes') : $t('common.no') }}</dd>

          <dt class="font-medium">{{ $t('common.hasBag') }}</dt>
          <dd>{{ player?.hasBag ? $t('common.yes') : $t('common.no') }}</dd>
        </dl>
      </template>
    </Card>
  </div>

  <Dialog v-model:visible="editVisible" modal header="Speler bewerken" :style="{ width: '400px' }">
    <div class="flex flex-col gap-4">
      <div>
        <label for="name">{{ $t('common.name') }}</label>
        <InputText v-model="editForm.name" fluid input-id="name" />
      </div>

      <div>
        <label for="clothingSize">{{ $t('common.clothingSize') }}</label>
        <Select
          v-model="editForm.clothingSize"
          :options="['164', '158', '152', '146', '140', '134', '128']"
          :placeholder="$t('common.clothingSize')"
          input-id="clothingSize"
          fluid
        />
      </div>

      <div class="flex items-center gap-2">
        <Checkbox v-model="editForm.hasJacket" binary input-id="hasJacket" />
        <label for="hasJacket">{{ $t('common.hasJacket') }}</label>
      </div>

      <div class="flex items-center gap-2">
        <Checkbox v-model="editForm.hasBag" binary input-id="hasBag" />
        <label for="hasBag">{{ $t('common.hasBag') }}</label>
      </div>
    </div>

    <template #footer>
      <div class="flex justify-between w-full">
        <Button
          :label="$t('common.cancel')"
          icon="pi pi-times"
          severity="secondary"
          text
          @click="editVisible = false"
        />
        <Button :label="$t('common.save')" icon="pi pi-check" @click="savePlayer" />
      </div>
    </template>
  </Dialog>
</template>
