<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { useRoute } from 'vue-router'
import { useMatchStore } from '@/stores/matchStore'
import { usePlayerStore } from '@/stores/playerStore'
import { useStoreAuth } from '@/stores/authStore'
import { SEASON } from '@/constants'

import { Skeleton, Card, Dialog, InputText, Checkbox, Select, Button } from 'primevue'
import type { Player } from '@/types'

const matchStore = useMatchStore()
const playerStore = usePlayerStore()
const AuthStore = useStoreAuth()
const route = useRoute()

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
}
</script>

<template>
  <h1 class="text-2xl font-bold mb-4 flex justify-between items-center">
    <span v-if="player">{{ player.name }}</span>
    <span v-else><Skeleton height="20px" width="100px" /></span>

    <Button
      v-if="player && AuthStore.user?.id"
      label="Bewerken"
      icon="pi pi-pencil"
      @click="openEditDialog"
    />
  </h1>

  <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
    <Card>
      <template #title
        ><h2>{{ $t('common.totalGoals') }}</h2></template
      >
      <template #content
        ><p class="text-3xl font-bold">{{ totalGoals }}</p></template
      >
    </Card>

    <Card>
      <template #title
        ><h2>{{ $t('common.totalAppearances') }}</h2></template
      >
      <template #content
        ><p class="text-3xl font-bold">{{ totalAppearances }}/{{ totalMatches }}</p></template
      >
    </Card>

    <Card>
      <template #title
        ><h2>{{ $t('common.totalKeeper') }}</h2></template
      >
      <template #content
        ><p class="text-3xl font-bold">{{ totalKeeper }}</p></template
      >
    </Card>

    <Card>
      <template #title><h2>Goals / wedstrijd</h2></template>
      <template #content
        ><p class="text-3xl font-bold">{{ goalsPerMatch }}</p></template
      >
    </Card>

    <Card>
      <template #title><h2>Aanwezigheid (%)</h2></template>
      <template #content
        ><p class="text-3xl font-bold">{{ attendancePercentage }}%</p></template
      >
    </Card>

    <Card class="md:col-span-3">
      <template #title><h2>Spelerinformatie</h2></template>
      <template #content>
        <dl class="grid grid-cols-2 gap-x-4 gap-y-2">
          <dt class="font-medium">Kledingmaat</dt>
          <dd>{{ player?.clothingSize ?? '-' }}</dd>

          <dt class="font-medium">Jas</dt>
          <dd>{{ player?.hasJacket ? '✅ Ja' : '❌ Nee' }}</dd>

          <dt class="font-medium">Tas</dt>
          <dd>{{ player?.hasBag ? '✅ Ja' : '❌ Nee' }}</dd>
        </dl>
      </template>
    </Card>
  </div>

  <Dialog v-model:visible="editVisible" modal header="Speler bewerken" :style="{ width: '400px' }">
    <div class="flex flex-col gap-4">
      <div>
        <label class="block mb-1">Naam</label>
        <InputText v-model="editForm.name" class="w-full" />
      </div>

      <div>
        <label class="block mb-1">Kledingmaat</label>
        <Select
          v-model="editForm.clothingSize"
          :options="['128', '134', '140', '146', '152', '158', '164']"
          placeholder="Selecteer maat"
          class="w-full"
        />
      </div>

      <div class="flex items-center gap-2">
        <Checkbox v-model="editForm.hasJacket" binary />
        <label>Heeft jas</label>
      </div>

      <div class="flex items-center gap-2">
        <Checkbox v-model="editForm.hasBag" binary />
        <label>Heeft tas</label>
      </div>
    </div>

    <template #footer>
      <Button label="Annuleren" icon="pi pi-times" text @click="editVisible = false" />
      <Button label="Opslaan" icon="pi pi-check" @click="savePlayer" />
    </template>
  </Dialog>
</template>
