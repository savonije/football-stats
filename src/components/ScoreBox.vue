<script setup lang="ts">
import { Button, Dialog, useToast, Select } from 'primevue'
import type { Match } from '@/types'
import { useStoreAuth } from '@/stores/authStore'
import { useMatchStore } from '@/stores/matchStore'
import { SEASON } from '@/constants'
import { useI18n } from 'vue-i18n'
import { computed, onMounted, ref } from 'vue'
import { usePlayerStore } from '@/stores/playerStore'

const props = defineProps<{
  match: Match
  type: 'for' | 'against'
  reversed?: boolean
}>()

const modal = defineModel<boolean>('visible')

const authStore = useStoreAuth()
const matchStore = useMatchStore()
const playerStore = usePlayerStore()
const toast = useToast()
const { t } = useI18n()

const seasonId = SEASON

const players = computed(() => matchStore.presentPlayersWithNames)

const selectedPlayer = ref<string | null>(null)

const updateGoals = async (delta: 1 | -1) => {
  if (!props.match?.id) return

  const matchId = props.match.id
  const currentGoals =
    props.type === 'for'
      ? (props.match.result?.goalsFor ?? 0)
      : (props.match.result?.goalsAgainst ?? 0)

  const newGoals = currentGoals + delta

  if (newGoals < 0) return

  await matchStore.updateMatchGoals(seasonId, matchId, props.type, newGoals)

  if (props.type === 'for') {
    modal.value = true
  }

  if (delta > 0) {
    toast.add({
      severity: 'info',
      summary: t('common.goal'),
      detail: t(`match.goalTypes.${props.type}`),
      life: 20000,
    })
  }
}

const saveGoal = async () => {
  if (!props.match?.id || !selectedPlayer.value) return

  const matchId = props.match.id

  const appearance = matchStore.appearances.find(
    (player) => player.present && player.playerId === selectedPlayer.value,
  )
  if (!appearance) return

  await matchStore.incrementPlayerGoals(seasonId, matchId, appearance.id, 1)

  modal.value = false
  selectedPlayer.value = null
}

onMounted(() => {
  if (!playerStore.playersLoaded) {
    playerStore.fetchPlayers()
  }
})
</script>

<template>
  <div class="flex" :class="reversed ? 'flex-row' : 'flex-row-reverse'">
    <div v-if="authStore.user?.id && !match.ended" class="flex justify-between gap-3 flex-col mx-6">
      <Button icon="pi pi-chevron-up" severity="secondary" text @click="updateGoals(1)" />

      <Button icon="pi pi-chevron-down" severity="secondary" text @click="updateGoals(-1)" />
    </div>

    <div class="score-box">
      <template v-if="type === 'for'">
        {{ match?.result?.goalsFor }}
      </template>
      <template v-else>
        {{ match?.result?.goalsAgainst }}
      </template>
    </div>
  </div>

  <Dialog
    v-model:visible="modal"
    modal
    :draggable="false"
    class="w-96"
    :header="t('match.goalScorer')"
  >
    <template #default>
      <Select
        v-model="selectedPlayer"
        :options="players"
        optionLabel="playerName"
        optionValue="playerId"
        :placeholder="t('player.selectPlayer')"
        fluid
      />
    </template>

    <template #footer>
      <Button :label="t('common.save')" icon="pi pi-check" @click="saveGoal" />
    </template>
  </Dialog>
</template>

<style scoped>
@reference '@/styles/main.css';

.score-box {
  @apply bg-white flex items-center justify-center text-4xl sm:text-6xl font-bold size-24 sm:size-32 rounded shadow;
}
</style>
